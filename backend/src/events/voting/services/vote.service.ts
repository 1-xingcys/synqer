import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VoteRepository } from '../repositories/vote.repository';
import {
  VoteEventDto,
  VoteMode,
  UpdateVoteDto,
  UpdateStagedVoteDto,
} from '../dto/vote-event.dto';
import { TimeSlotRepository } from '../../shared/repositories/time-slot.repository';
import { zonedWallClockToInstant } from '../../../common/time';

/**
 * Vote service (business logic layer)
 */
@Injectable()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
    private timeSlotRepository: TimeSlotRepository,
  ) {}

  /**
   * Save a user's vote.
   *
   * Two modes: in available mode they pick the times they can make and
   * everything unpicked counts as a no; in unavailable mode they pick the
   * times they cannot make and everything unpicked counts as a yes.
   */
  async vote(
    eventId: string,
    userId: string,
    voteDto: VoteEventDto,
    now: Date = new Date(),
  ) {
    const { selectedSlotIds, voteMode = VoteMode.AVAILABLE } = voteDto;
    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId, now);
    await this.validateParticipantAndGetVoteStatus(eventId, userId);

    // Dedupe, and check every selected slot belongs to this event
    const uniqueSelectedSlotIds = [...new Set(selectedSlotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, uniqueSelectedSlotIds);

    // Derive the available slots from the vote mode
    let availableSlotIds: string[];

    if (voteMode === VoteMode.UNAVAILABLE) {
      // Picking unavailable times means every other slot counts as available
      const unavailableSet = new Set(uniqueSelectedSlotIds);
      availableSlotIds = allSlotIds.filter((id) => !unavailableSet.has(id));
    } else {
      // Picking available times means the deduped selection is the answer
      availableSlotIds = uniqueSelectedSlotIds;
    }

    // Run the vote in a transaction
    const result = await this.voteRepository.submitVoteInTransaction(
      eventId,
      userId,
      availableSlotIds,
    );

    return {
      success: true,
      votedSlots: result.availableSlotIds.length,
      voteMode,
    };
  }

  /**
   * Update a user's votes incrementally: add rows for addSlotIds and drop
   * the rows for removeSlotIds.
   */
  async updateVotes(
    eventId: string,
    userId: string,
    updateVoteDto: UpdateVoteDto,
    now: Date = new Date(),
  ) {
    const { addSlotIds = [], removeSlotIds = [] } = updateVoteDto;
    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId, now);
    await this.validateParticipantAndGetVoteStatus(eventId, userId);

    if (addSlotIds.length === 0 && removeSlotIds.length === 0) {
      return { success: true, added: 0, removed: 0 };
    }

    const uniqueAddSlotIds = [...new Set(addSlotIds)];
    const uniqueRemoveSlotIds = [...new Set(removeSlotIds)];

    const allRequestedIds = [...uniqueAddSlotIds, ...uniqueRemoveSlotIds];
    this.validateSlotIdsBelongToEvent(allSlotIds, allRequestedIds);

    // Run the incremental update in a transaction
    const result = await this.voteRepository.updateVotesInTransaction(
      eventId,
      userId,
      uniqueAddSlotIds,
      uniqueRemoveSlotIds,
    );

    return {
      success: true,
      added: result.addSlotIds.length,
      removed: result.removeSlotIds.length,
    };
  }

  /**
   * Update the staged draft incrementally (canonical available slots)
   */
  async updateStagedVotes(
    eventId: string,
    userId: string,
    updateStagedVoteDto: UpdateStagedVoteDto,
  ) {
    const {
      addSlotIds = [],
      removeSlotIds = [],
      voteMode = VoteMode.AVAILABLE,
    } = updateStagedVoteDto;

    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId);
    const participantVoteStatus =
      await this.validateParticipantAndGetVoteStatus(eventId, userId);

    if (addSlotIds.length === 0 && removeSlotIds.length === 0) {
      const existingStagedVote = await this.voteRepository.findUserStagedVote(
        eventId,
        userId,
      );
      return {
        success: true,
        stagedSlotCount: existingStagedVote?.slotIds.length ?? 0,
      };
    }
    const uniqueAddSlotIds = [...new Set(addSlotIds)];
    const uniqueRemoveSlotIds = [...new Set(removeSlotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, [
      ...uniqueAddSlotIds,
      ...uniqueRemoveSlotIds,
    ]);

    // Read, apply the delta and write have to happen in one critical section:
    // two clicks arriving at once would otherwise read the same stale draft,
    // and the later write would drop the earlier one's slots.
    return this.voteRepository.runInStagedVoteLock(
      eventId,
      userId,
      async (tx) => {
        const existingStagedVote = await this.voteRepository.findUserStagedVote(
          eventId,
          userId,
          tx,
        );

        let baseAvailableSlotIds: string[];
        let baselineSlotIds: string[];

        if (existingStagedVote) {
          baseAvailableSlotIds = this.toCanonicalSlotIds(
            allSlotIds,
            existingStagedVote.slotIds,
          );

          baselineSlotIds = this.toCanonicalSlotIds(
            allSlotIds,
            existingStagedVote.baselineSlotIds,
          );
        } else {
          const hasVoted = Boolean(participantVoteStatus?.hasVoted);

          if (hasVoted) {
            baseAvailableSlotIds =
              await this.voteRepository.findUserCommittedSlotIds(
                eventId,
                userId,
                tx,
              );
          } else if (voteMode === VoteMode.UNAVAILABLE) {
            baseAvailableSlotIds = allSlotIds;
          } else {
            baseAvailableSlotIds = [];
          }

          baselineSlotIds = this.toCanonicalSlotIds(
            allSlotIds,
            baseAvailableSlotIds,
          );
          baseAvailableSlotIds = [...baselineSlotIds];
        }

        const nextAvailableSlotIds = new Set(baseAvailableSlotIds);
        uniqueAddSlotIds.forEach((slotId) => nextAvailableSlotIds.add(slotId));
        uniqueRemoveSlotIds.forEach((slotId) =>
          nextAvailableSlotIds.delete(slotId),
        );

        const nextCanonicalSlotIds = this.toCanonicalSlotIds(
          allSlotIds,
          nextAvailableSlotIds,
        );

        if (this.areSameSlotIds(nextCanonicalSlotIds, baselineSlotIds)) {
          if (existingStagedVote) {
            await this.voteRepository.deleteStagedVote(eventId, userId, tx);
          }
          return {
            success: true,
            stagedSlotCount: 0,
          };
        }

        await this.voteRepository.upsertStagedVote(
          eventId,
          userId,
          nextCanonicalSlotIds,
          baselineSlotIds,
          tx,
        );

        return {
          success: true,
          stagedSlotCount: nextCanonicalSlotIds.length,
        };
      },
    );
  }

  /**
   * Commit the staged draft into committed votes
   */
  async commitStagedVotes(eventId: string, userId: string) {
    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId);
    await this.validateParticipantAndGetVoteStatus(eventId, userId);
    const stagedVote = await this.voteRepository.findUserStagedVote(
      eventId,
      userId,
    );

    if (!stagedVote) {
      throw new BadRequestException('尚無暫存投票可提交');
    }

    const stagedSlotIds = [...new Set(stagedVote.slotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, stagedSlotIds);

    const result = await this.voteRepository.commitStagedVotesInTransaction(
      eventId,
      userId,
      stagedSlotIds,
    );

    return {
      success: true,
      committedSlots: result.availableSlotIds.length,
    };
  }

  /**
   * Check the event is open for voting and return all of its slot IDs
   */
  private async validateEventAndGetAllSlotIds(
    eventId: string,
    now: Date = new Date(),
  ) {
    const event = await this.voteRepository.findEventVotingInfo(eventId);

    if (!event || event.isDeleted) {
      throw new BadRequestException('活動不存在');
    }

    if (event.votingDeadline) {
      // votingDeadline is stored as naive wall-clock digits; resolve it to a
      // real instant before comparing it against a real now.
      const deadlineInstant = zonedWallClockToInstant(
        event.votingDeadline,
        event.timeZone,
      );
      if (now > deadlineInstant) {
        throw new BadRequestException('投票已截止');
      }
    }

    return this.timeSlotRepository.findIdsByEventId(eventId);
  }

  /**
   * Check the given slot IDs all belong to the event
   */
  private validateSlotIdsBelongToEvent(
    allSlotIds: string[],
    requestedSlotIds: string[],
  ) {
    const allSlotIdSet = new Set(allSlotIds);
    const invalidSlotIds = requestedSlotIds.filter(
      (id) => !allSlotIdSet.has(id),
    );
    if (invalidSlotIds.length > 0) {
      throw new BadRequestException('部分時段不屬於此活動');
    }
  }

  /**
   * Check the user is a valid expected participant of the event
   */
  private async validateParticipantAndGetVoteStatus(
    eventId: string,
    userId: string,
  ) {
    const participantVoteStatus =
      await this.voteRepository.findParticipantVoteStatus(eventId, userId);

    if (!participantVoteStatus) {
      throw new ForbiddenException('非活動參與者不可投票');
    }

    return participantVoteStatus;
  }

  /**
   * Emit canonical slot IDs, ordered by the event's own slot order
   */
  private toCanonicalSlotIds(allSlotIds: string[], slotIds: Iterable<string>) {
    const slotIdSet = new Set(slotIds);
    return allSlotIds.filter((id) => slotIdSet.has(id));
  }

  private areSameSlotIds(left: string[], right: string[]) {
    if (left.length !== right.length) return false;
    return left.every((slotId, index) => slotId === right[index]);
  }
}
