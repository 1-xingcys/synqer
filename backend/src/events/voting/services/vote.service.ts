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

/**
 * 投票服務（業務邏輯層）
 */
@Injectable()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
    private timeSlotRepository: TimeSlotRepository,
  ) {}

  /**
   * 儲存使用者的投票
   * 支援兩種模式：
   * 1. available: 投自己「可以」的時間，未選擇的時段視為不行
   * 2. unavailable: 投自己「不行」的時間，未選擇的時段視為可以
   */
  async vote(eventId: string, userId: string, voteDto: VoteEventDto) {
    const { selectedSlotIds, voteMode = VoteMode.AVAILABLE } = voteDto;
    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId);
    await this.validateParticipantAndGetVoteStatus(eventId, userId);

    // 去重並驗證 selectedSlotIds 都屬於該活動
    const uniqueSelectedSlotIds = [...new Set(selectedSlotIds)];
    this.validateSlotIdsBelongToEvent(allSlotIds, uniqueSelectedSlotIds);

    // 根據投票模式計算「有空」的時段
    let availableSlotIds: string[];

    if (voteMode === VoteMode.UNAVAILABLE) {
      // 如果是投「不行」的時間，把其他時間都視為可以
      const unavailableSet = new Set(uniqueSelectedSlotIds);
      availableSlotIds = allSlotIds.filter((id) => !unavailableSet.has(id));
    } else {
      // 如果是投「可以」的時間，使用去重後的選擇
      availableSlotIds = uniqueSelectedSlotIds;
    }

    // 使用 transaction 執行投票
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
   * 增量更新使用者的投票
   * 新增 addSlotIds 的投票紀錄、移除 removeSlotIds 的投票紀錄
   */
  async updateVotes(
    eventId: string,
    userId: string,
    updateVoteDto: UpdateVoteDto,
  ) {
    const { addSlotIds = [], removeSlotIds = [] } = updateVoteDto;
    const allSlotIds = await this.validateEventAndGetAllSlotIds(eventId);
    await this.validateParticipantAndGetVoteStatus(eventId, userId);

    if (addSlotIds.length === 0 && removeSlotIds.length === 0) {
      return { success: true, added: 0, removed: 0 };
    }

    const uniqueAddSlotIds = [...new Set(addSlotIds)];
    const uniqueRemoveSlotIds = [...new Set(removeSlotIds)];

    const allRequestedIds = [...uniqueAddSlotIds, ...uniqueRemoveSlotIds];
    this.validateSlotIdsBelongToEvent(allSlotIds, allRequestedIds);

    // 使用 transaction 執行增量更新
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
   * 增量更新 staged 草稿（canonical available slots）
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

    const existingStagedVote = await this.voteRepository.findUserStagedVote(
      eventId,
      userId,
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
          await this.voteRepository.findUserCommittedSlotIds(eventId, userId);
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
        await this.voteRepository.deleteStagedVote(eventId, userId);
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
    );

    return {
      success: true,
      stagedSlotCount: nextCanonicalSlotIds.length,
    };
  }

  /**
   * 提交 staged 草稿為 committed votes
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
   * 驗證活動可投票並回傳所有 slot IDs
   */
  private async validateEventAndGetAllSlotIds(eventId: string) {
    const event = await this.voteRepository.findEventVotingInfo(eventId);

    if (!event || event.isDeleted) {
      throw new BadRequestException('活動不存在');
    }

    if (event.votingDeadline && new Date() > event.votingDeadline) {
      throw new BadRequestException('投票已截止');
    }

    return this.timeSlotRepository.findIdsByEventId(eventId);
  }

  /**
   * 驗證指定 slot IDs 是否都屬於活動
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
   * 驗證使用者是否為活動的有效預期參與者
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
   * 依照活動原始 slot 順序輸出 canonical slot IDs
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
