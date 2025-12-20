import { Injectable } from '@nestjs/common';
import { EventStatusService } from './event-status.service';

/**
 * 活動數據轉換服務
 */
@Injectable()
export class EventMapperService {
  constructor(private eventStatusService: EventStatusService) {}

  /**
   * 轉換 votes 數據為簡化格式
   */
  mapVotes(
    votes: Array<{
      slotId: string;
      userId: string;
      user: { displayName: string | null };
    }>,
  ) {
    return votes.map((vote) => ({
      slotId: vote.slotId,
      userId: vote.userId,
      userDisplayName: vote.user.displayName || 'Anonymous',
    }));
  }

  /**
   * 從 votes 中提取參與者列表
   */
  extractParticipants(
    votes: Array<{ userId: string; user: { displayName: string | null } }>,
  ) {
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string }
    >();
    votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user.displayName || 'Anonymous',
        });
      }
    });
    return Array.from(participantsMap.values());
  }

  /**
   * 從 votes 中提取參與者列表（Host 版本，包含 hasVoted）
   */
  extractParticipantsForHost(
    votes: Array<{ userId: string; user: { displayName: string | null } }>,
  ) {
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string; hasVoted: boolean }
    >();
    votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user.displayName || 'Anonymous',
          hasVoted: true,
        });
      }
    });
    return Array.from(participantsMap.values());
  }

  /**
   * 計算投票統計
   */
  calculateVotingStats(
    expectedParticipants: Array<{ hasVoted?: boolean }>,
    participants: Array<{ hasVoted?: boolean }>,
  ) {
    const totalExpected = expectedParticipants.length || participants.length;
    const totalVoted = participants.filter((p) => p.hasVoted).length;
    const votingPercentage =
      totalExpected > 0 ? (totalVoted / totalExpected) * 100 : 0;

    return {
      totalExpected,
      totalVoted,
      votingPercentage,
    };
  }

  /**
   * 映射事件為列表項格式
   */
  mapEventToList(
    event: {
      id: string;
      title: string | null;
      description: string | null;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
      votingDeadline: Date | null;
      confirmedStartTime: Date | null;
      confirmedEndTime: Date | null;
      expectedParticipants?: Array<{ id: string }>;
    },
    includeStatus = true,
  ) {
    const base = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      createdAt: event.createdAt,
      votingDeadline: event.votingDeadline,
      confirmedStartTime: event.confirmedStartTime,
      confirmedEndTime: event.confirmedEndTime,
    };

    if (includeStatus) {
      return {
        ...base,
        participantCount: event.expectedParticipants?.length || 0,
        status: this.eventStatusService.computeEventStatus({
          votingDeadline: event.votingDeadline,
          confirmedStartTime: event.confirmedStartTime,
          confirmedEndTime: event.confirmedEndTime,
        }),
      };
    }

    return base;
  }

  /**
   * 映射事件為詳細格式
   */
  mapEventToDetail(event: {
    id: string;
    title: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date;
    startMinuteOfDay: number;
    endMinuteOfDay: number;
    slotDurationMin: number;
    timeZone: string;
    lineGroupId: string | null;
    ownerId: string | null;
    votingDeadline: Date | null;
    confirmedStartTime: Date | null;
    confirmedEndTime: Date | null;
  }) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      startMinuteOfDay: event.startMinuteOfDay,
      endMinuteOfDay: event.endMinuteOfDay,
      slotDurationMin: event.slotDurationMin,
      timeZone: event.timeZone,
      lineGroupId: event.lineGroupId,
      ownerId: event.ownerId,
      votingDeadline: event.votingDeadline,
      confirmedStartTime: event.confirmedStartTime,
      confirmedEndTime: event.confirmedEndTime,
      status: this.eventStatusService.computeEventStatus({
        votingDeadline: event.votingDeadline,
        confirmedStartTime: event.confirmedStartTime,
        confirmedEndTime: event.confirmedEndTime,
      }),
    };
  }
}
