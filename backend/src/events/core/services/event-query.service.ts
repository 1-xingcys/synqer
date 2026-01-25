import { Injectable } from '@nestjs/common';
import { EventRepository } from '../repositories/event.repository';
import { EventMapperService } from '../../shared/services/event-mapper.service';
import { EventStatusService } from '../../shared/services/event-status.service';

interface VoteStats<T extends { userId: string }> {
  activeParticipantUserIds: Set<string>;
  filteredVotes: T[];
  votedUserIds: Set<string>;
  votedCount: number;
}

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
   * 查詢用戶創建的活動
   */
  async findUserEvents(userId: string) {
    const events = await this.eventRepository.findByOwnerId(userId);

    return events.map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;
      const { votedCount } = this.calculateVoteStats(
        event.expectedParticipants,
        event.votes,
      );

      return {
        ...this.eventMapper.mapEventToList(event),
        expectedParticipantCount,
        votedCount,
      };
    });
  }

  /**
   * 查詢用戶參與的活動
   */
  async findAttendedEvents(userId: string) {
    const events = await this.eventRepository.findByParticipantUserId(userId);

    return events.map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;
      const { activeParticipantUserIds, votedUserIds, votedCount } =
        this.calculateVoteStats(event.expectedParticipants, event.votes);

      // 檢查當前用戶是否已投票（且未被移除）
      const hasVoted =
        activeParticipantUserIds.has(userId) && votedUserIds.has(userId);

      return {
        ...this.eventMapper.mapEventToList(event),
        hasVoted,
        expectedParticipantCount,
        votedCount,
        host: event.owner
          ? {
              id: event.owner.id,
              displayName: event.owner.displayName,
              avatarUrl: event.owner.avatarUrl,
            }
          : null,
      };
    });
  }

  /**
   * 查詢單個活動詳情
   */
  async findOne(eventId: string) {
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
        participants: [],
        expectedParticipants: [],
      };
    }

    const { filteredVotes, votedUserIds } = this.calculateVoteStats(
      event.expectedParticipants,
      event.votes,
    );

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants = this.eventMapper.extractParticipants(filteredVotes);

    // 整理預期參與者資料
    const expectedParticipants = event.expectedParticipants.map((ep) => {
      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;
      return {
        id: ep.id,
        lineUserId: ep.lineUserId,
        userId: ep.userId,
        hasVoted,
        reminderSentAt: ep.reminderSentAt,
        user: ep.user,
      };
    });

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      lineGroup: event.lineGroup,
      slots: event.slots,
      votes,
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
        participants: [],
        expectedParticipants: [],
        votingStats: {
          totalExpected: 0,
          totalVoted: 0,
          votingPercentage: 0,
        },
      };
    }

    const { filteredVotes, votedUserIds } = this.calculateVoteStats(
      event.expectedParticipants,
      event.votes,
    );

    const votes = this.eventMapper.mapVotes(filteredVotes);
    const participants =
      this.eventMapper.extractParticipantsForHost(filteredVotes);

    // 整理預期參與者資料
    const expectedParticipants = event.expectedParticipants.map((ep) => {
      const hasVoted = ep.userId ? votedUserIds.has(ep.userId) : false;
      return {
        id: ep.id,
        lineUserId: ep.lineUserId || undefined,
        userId: ep.userId || undefined,
        displayName: ep.user?.displayName || undefined,
        pictureUrl: ep.user?.avatarUrl || undefined,
        hasVoted,
      };
    });

    const votingStats = this.eventMapper.calculateVotingStats(
      expectedParticipants,
      participants,
    );

    return {
      isDeleted: false,
      event: this.eventMapper.mapEventToDetail(event),
      slots: event.slots,
      votes,
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
        ...this.eventMapper.mapEventToList(event, false),
        participantCount: 0,
        status: this.eventStatusService.computeEventStatus({
          votingDeadline: event.votingDeadline,
          confirmedTimeSlots: [],
        }),
      };
    }

    const confirmedTimeSlots = event.confirmedTimeSlots.map((cts) => ({
      slotId: cts.slotId,
      date: cts.slot.date,
      startMinute: cts.slot.startMinute,
      endMinute: cts.slot.endMinute,
    }));

    return {
      isDeleted: false,
      ...this.eventMapper.mapEventToList(event, false),
      participantCount: event.expectedParticipants.length,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: event.votingDeadline,
        confirmedTimeSlots,
      }),
    };
  }

  /**
   * 計算投票統計資料（過濾已移除參與者的投票）
   */
  private calculateVoteStats<T extends { userId: string }>(
    expectedParticipants: Array<{ userId: string | null }>,
    votes: T[],
  ): VoteStats<T> {
    // 取得未被移除的預期參與者的 userId 集合
    const activeParticipantUserIds = new Set<string>(
      expectedParticipants
        .filter((ep) => ep.userId)
        .map((ep) => ep.userId as string),
    );

    // 過濾 votes，只保留未被移除的預期參與者的投票
    const filteredVotes = votes.filter((v) =>
      activeParticipantUserIds.has(v.userId),
    );

    // 從過濾後的 votes 表建立已投票的 userId Set
    const votedUserIds = new Set<string>(filteredVotes.map((v) => v.userId));

    // 計算 expectedParticipants 中已投票的人數
    const votedCount = expectedParticipants.filter(
      (p) => p.userId && votedUserIds.has(p.userId),
    ).length;

    return {
      activeParticipantUserIds,
      filteredVotes,
      votedUserIds,
      votedCount,
    };
  }
}
