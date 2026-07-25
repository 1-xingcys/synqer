import { Injectable } from '@nestjs/common';
import { EventType, EventVoteMode, Weekday } from '@prisma/client';
import { EventStatusService } from './event-status.service';
import { ConfirmedTimeService } from './confirmed-time.service';
import { ConfirmedTimeSlotData } from '../interfaces/confirmed-time.interface';
import { EventCapabilities } from '../interfaces/event-contract.interface';
import { EventCapabilitiesService } from './event-capabilities.service';
import {
  EventScheduleService,
  EventScheduleSource,
} from './event-schedule.service';

type MappedEventList = {
  id: string;
  type: EventType;
  title: string | null;
  description: string | null;
  schedule: {
    kind: EventType;
    startDate?: Date;
    endDate?: Date;
    weekdays?: Weekday[];
    startMinuteOfDay: number;
    endMinuteOfDay: number;
    slotDurationMin: number;
  };
  createdAt: Date;
  votingDeadline: Date | null;
  confirmedSlotIds: string[];
  confirmedSelections: ReturnType<ConfirmedTimeService['mergeToSelections']>;
  status: ReturnType<EventStatusService['computeEventStatus']>;
  capabilities: EventCapabilities;
};

/**
 * 活動數據轉換服務
 */
@Injectable()
export class EventMapperService {
  constructor(
    private eventStatusService: EventStatusService,
    private confirmedTimeService: ConfirmedTimeService,
    private eventCapabilitiesService: EventCapabilitiesService,
    private eventScheduleService: EventScheduleService,
  ) {}

  /**
   * 轉換 votes 數據為簡化格式
   */
  mapVotes(
    votes: Array<{
      slotId: string;
      userId: string;
      user: { displayName: string | null } | null;
    }>,
  ) {
    return votes.map((vote) => ({
      slotId: vote.slotId,
      userId: vote.userId,
      userDisplayName: vote.user?.displayName || 'Anonymous',
    }));
  }

  /**
   * 從 votes 中提取參與者列表
   */
  extractParticipants(
    votes: Array<{
      userId: string;
      user: { displayName: string | null } | null;
    }>,
  ) {
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string }
    >();
    votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user?.displayName || 'Anonymous',
        });
      }
    });
    return Array.from(participantsMap.values());
  }

  /**
   * 從 votes 中提取參與者列表（Host 版本，包含 hasVoted）
   */
  extractParticipantsForHost(
    votes: Array<{
      userId: string;
      user: { displayName: string | null } | null;
    }>,
  ) {
    const participantsMap = new Map<
      string,
      { userId: string; displayName: string; hasVoted: boolean }
    >();
    votes.forEach((vote) => {
      if (!participantsMap.has(vote.userId)) {
        participantsMap.set(vote.userId, {
          userId: vote.userId,
          displayName: vote.user?.displayName || 'Anonymous',
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
  mapEventToList(event: {
    id: string;
    type: EventType;
    title: string | null;
    description: string | null;
    createdAt: Date;
    timeZone: string;
    votingDeadline: Date | null;
    oneTimeSchedule: EventScheduleSource['oneTimeSchedule'];
    recurringSchedule: EventScheduleSource['recurringSchedule'];
    confirmedTimeSlots?: ConfirmedTimeSlotData[];
  }): MappedEventList {
    const schedule = this.eventScheduleService.resolveSchedule(event);
    const confirmedSlotIds =
      event.confirmedTimeSlots?.map((cts) => cts.slotId) || [];
    const confirmedSelections = this.confirmedTimeService.mergeToSelections(
      event.confirmedTimeSlots || [],
    );

    return {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      schedule: {
        kind: schedule.type,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        weekdays: schedule.weekdays,
        startMinuteOfDay: schedule.startMinuteOfDay,
        endMinuteOfDay: schedule.endMinuteOfDay,
        slotDurationMin: schedule.slotDurationMin,
      },
      createdAt: event.createdAt,
      votingDeadline: event.votingDeadline,
      confirmedSlotIds,
      confirmedSelections,
      status: this.eventStatusService.computeEventStatus({
        eventType: event.type,
        votingDeadline: event.votingDeadline,
        timeZone: event.timeZone,
        confirmedTimeSlots: event.confirmedTimeSlots,
      }),
      capabilities: this.eventCapabilitiesService.buildCapabilities(event.type),
    };
  }

  /**
   * 映射事件為詳細格式
   */
  mapEventToDetail(event: {
    id: string;
    type: EventType;
    title: string | null;
    description: string | null;
    createdAt: Date;
    timeZone: string;
    defaultGranularityMin: number;
    defaultVoteMode: EventVoteMode;
    lineGroupId: string | null;
    ownerId: string | null;
    votingDeadline: Date | null;
    oneTimeSchedule: EventScheduleSource['oneTimeSchedule'];
    recurringSchedule: EventScheduleSource['recurringSchedule'];
    confirmedTimeSlots?: ConfirmedTimeSlotData[];
  }) {
    const schedule = this.eventScheduleService.resolveSchedule(event);
    const confirmedSlotIds =
      event.confirmedTimeSlots?.map((cts) => cts.slotId) || [];
    const confirmedSelections = this.confirmedTimeService.mergeToSelections(
      event.confirmedTimeSlots || [],
    );

    return {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      schedule: {
        kind: schedule.type,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        weekdays: schedule.weekdays,
        startMinuteOfDay: schedule.startMinuteOfDay,
        endMinuteOfDay: schedule.endMinuteOfDay,
        slotDurationMin: schedule.slotDurationMin,
      },
      timeZone: event.timeZone,
      defaultGranularityMin: event.defaultGranularityMin,
      defaultVoteMode: event.defaultVoteMode,
      lineGroupId: event.lineGroupId,
      ownerId: event.ownerId,
      votingDeadline: event.votingDeadline,
      confirmedSlotIds,
      confirmedSelections,
      status: this.eventStatusService.computeEventStatus({
        eventType: event.type,
        votingDeadline: event.votingDeadline,
        timeZone: event.timeZone,
        confirmedTimeSlots: event.confirmedTimeSlots,
      }),
      capabilities: this.eventCapabilitiesService.buildCapabilities(event.type),
    };
  }
}
