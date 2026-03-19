import { Injectable } from '@nestjs/common';
import { EventSlotAxisType, Weekday } from '@prisma/client';
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
   * 查詢用戶創建的活動
   */
  async findUserEvents(userId: string) {
    const events = await this.eventRepository.findByOwnerId(userId);

    return events.map((event) => {
      const expectedParticipantCount = event.expectedParticipants.length;
      const votedCount = event.expectedParticipants.filter(
        (ep) => ep.hasVoted,
      ).length;

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
      const votedCount = event.expectedParticipants.filter(
        (ep) => ep.hasVoted,
      ).length;
      const currentUserParticipant = event.expectedParticipants.find(
        (ep) => ep.userId === userId,
      );

      // 檢查當前用戶是否已投票（且未被移除）
      const hasVoted = Boolean(currentUserParticipant?.hasVoted);

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
      slots: this.mapSlots(event.slots),
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
      slots: this.mapSlots(event.slots),
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
        expectedParticipantCount: 0,
        status: this.eventStatusService.computeEventStatus({
          eventType: event.type,
          votingDeadline: event.votingDeadline,
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

  private mapSlots(
    slots: Array<{
      id: string;
      eventId: string;
      axisType: EventSlotAxisType;
      axisDate: Date | null;
      axisWeekday: Weekday | null;
      startMinute: number;
      endMinute: number;
      index: number;
    }>,
  ) {
    return slots.map((slot) => ({
      id: slot.id,
      eventId: slot.eventId,
      date: this.getSlotDate(slot.axisType, slot.axisDate, slot.axisWeekday),
      axisType: slot.axisType,
      axisWeekday: slot.axisWeekday,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      index: slot.index,
    }));
  }

  private getSlotDate(
    axisType: EventSlotAxisType,
    axisDate: Date | null,
    axisWeekday: Weekday | null,
  ) {
    if (axisType === EventSlotAxisType.DATE && axisDate) {
      return axisDate;
    }

    const anchorDates: Record<Weekday, Date> = {
      [Weekday.MONDAY]: new Date('2000-01-03T00:00:00.000Z'),
      [Weekday.TUESDAY]: new Date('2000-01-04T00:00:00.000Z'),
      [Weekday.WEDNESDAY]: new Date('2000-01-05T00:00:00.000Z'),
      [Weekday.THURSDAY]: new Date('2000-01-06T00:00:00.000Z'),
      [Weekday.FRIDAY]: new Date('2000-01-07T00:00:00.000Z'),
      [Weekday.SATURDAY]: new Date('2000-01-08T00:00:00.000Z'),
      [Weekday.SUNDAY]: new Date('2000-01-09T00:00:00.000Z'),
    };

    if (!axisWeekday) {
      throw new Error('Slot is missing axisDate and axisWeekday');
    }

    return anchorDates[axisWeekday];
  }
}
