import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { EventMapperService } from '../../shared/services/event-mapper.service';
import { EventStatusService } from '../../shared/services/event-status.service';

/**
 * 活動查詢服務（業務邏輯層）
 */
@Injectable()
export class EventQueryService {
  constructor(
    private eventRepository: EventRepository,
    private eventMapper: EventMapperService,
    private eventStatusService: EventStatusService,
  ) {}

  /**
   * 查詢用戶「有份」的所有活動（主辦 ∪ 參與），以 isHost 標記角色。
   */
  async findMyInvolvedEvents(userId: string) {
    const [hosted, participated] = await Promise.all([
      this.eventRepository.findByOwnerId(userId),
      this.eventRepository.findByParticipantUserId(userId),
    ]);

    type InvolvedEvent =
      | (typeof hosted)[number]
      | (typeof participated)[number];
    const byId = new Map<string, InvolvedEvent>();
    for (const event of participated) {
      byId.set(event.id, event);
    }
    for (const event of hosted) {
      if (!byId.has(event.id)) {
        byId.set(event.id, event);
      }
    }

    return Array.from(byId.values()).map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;
      const votedCount = event.expectedParticipants.filter(
        (ep) => ep.hasVoted,
      ).length;
      const currentUserParticipant = event.expectedParticipants.find(
        (ep) => ep.userId === userId,
      );
      const owner = 'owner' in event ? event.owner : null;

      return {
        ...this.eventMapper.mapEventToList(event),
        expectedParticipantCount,
        votedCount,
        hasVoted: Boolean(currentUserParticipant?.hasVoted),
        isHost: event.ownerId === userId,
        host: owner
          ? {
              id: owner.id,
              displayName: owner.displayName,
              avatarUrl: owner.avatarUrl,
            }
          : null,
      };
    });
  }

  /**
   * 查詢單個活動詳情
   */
  async findOne(eventId: string, userId: string) {
    const event = await this.eventRepository.findOneWithDetails(eventId);

    if (!event) {
      return null;
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        event: this.eventMapper.mapEventToDetail(event),
        lineGroup: event.lineGroup,
        slots: [],
        votes: [],
        stagedVote: null,
        participants: [],
        expectedParticipants: [],
      };
    }

    const filteredVotes = this.filterVotesByActiveParticipants(
      event.expectedParticipants,
      event.votes,
    );

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants = this.eventMapper.extractParticipants(filteredVotes);

    const stagedVote = await this.eventRepository.findStagedVoteByEventAndUser(
      eventId,
      userId,
    );

    // 整理預期參與者資料
    const expectedParticipants = event.expectedParticipants.map((ep) => ({
      id: ep.id,
      lineUserId: ep.lineUserId,
      userId: ep.userId,
      hasVoted: ep.hasVoted,
      reminderSentAt: ep.reminderSentAt,
      user: ep.user,
    }));

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      lineGroup: event.lineGroup,
      slots: event.slots,
      votes,
      stagedVote,
      participants,
      expectedParticipants,
    };
  }

  /**
   * 查詢 Host 端的活動詳情
   */
  async findOneHosted(eventId: string, userId: string) {
    const event = await this.eventRepository.findOneWithDetails(eventId);

    if (!event) {
      return null;
    }

    if (event.ownerId !== userId) {
      return null; // 權限檢查由調用者處理
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        event: this.eventMapper.mapEventToDetail(event),
        slots: [],
        votes: [],
        stagedConfirmation: null,
        participants: [],
        expectedParticipants: [],
        votingStats: {
          totalExpected: 0,
          totalVoted: 0,
          votingPercentage: 0,
        },
      };
    }

    const filteredVotes = this.filterVotesByActiveParticipants(
      event.expectedParticipants,
      event.votes,
    );

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants =
      this.eventMapper.extractParticipantsForHost(filteredVotes);
    const stagedConfirmation =
      await this.eventRepository.findStagedConfirmationByEventId(eventId);

    // 整理預期參與者資料
    const expectedParticipants = event.expectedParticipants.map((ep) => ({
      id: ep.id,
      lineUserId: ep.lineUserId || undefined,
      userId: ep.userId || undefined,
      displayName: ep.user?.displayName || undefined,
      pictureUrl: ep.user?.avatarUrl || undefined,
      hasVoted: ep.hasVoted,
    }));

    const votingStats = this.eventMapper.calculateVotingStats(
      expectedParticipants,
      participants,
    );

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      slots: event.slots,
      votes,
      stagedConfirmation,
      participants,
      expectedParticipants,
      votingStats,
    };
  }

  /**
   * 查詢活動公開信息
   */
  async getEventPublicInfo(eventId: string) {
    const event = await this.eventRepository.findPublicInfo(eventId);

    if (!event) {
      return null;
    }

    // 檢查活動是否已被軟刪除
    if (event.isDeleted) {
      return {
        isDeleted: true,
        ...this.eventMapper.mapEventToList(event),
        timeZone: event.timeZone,
        expectedParticipantCount: 0,
        status: this.eventStatusService.computeEventStatus({
          eventType: event.type,
          votingDeadline: event.votingDeadline,
          timeZone: event.timeZone,
          confirmedTimeSlots: [],
        }),
      };
    }

    const host = event.owner
      ? {
          id: event.owner.id,
          displayName: event.owner.displayName,
          avatarUrl: event.owner.avatarUrl,
        }
      : null;

    return {
      isDeleted: false,
      ...this.eventMapper.mapEventToList(event),
      timeZone: event.timeZone,
      expectedParticipantCount: event.expectedParticipants.length,
      host,
    };
  }

  private filterVotesByActiveParticipants<T extends { userId: string }>(
    expectedParticipants: Array<{ userId: string | null }>,
    votes: T[],
  ): T[] {
    const activeParticipantUserIds = new Set(
      expectedParticipants
        .filter((ep) => ep.userId)
        .map((ep) => ep.userId as string),
    );

    return votes.filter((v) => activeParticipantUserIds.has(v.userId));
  }
}
