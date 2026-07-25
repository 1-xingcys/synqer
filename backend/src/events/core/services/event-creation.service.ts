import { Injectable, BadRequestException } from '@nestjs/common';
import { EventType, EventVoteMode, Weekday } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { TimeSlotService } from '../../shared/services/time-slot.service';
import { EventRepository } from '../repositories/event.repository';
import { DEFAULT_TIME_ZONE } from '../../../common/time';
import { DEFAULT_GRANULARITY_MIN } from '../../../../shared/event-preference.constants';

@Injectable()
export class EventCreationService {
  constructor(
    private eventRepository: EventRepository,
    private timeSlotService: TimeSlotService,
  ) {}

  /**
   * Create an event and handle all the related data
   */
  async create(createEventDto: CreateEventDto, userId?: string) {
    const {
      type = EventType.ONE_TIME,
      title,
      description,
      startDate,
      endDate,
      weekdays,
      startTime,
      endTime,
      slotDurationMin = 15,
      timeZone = DEFAULT_TIME_ZONE,
      defaultGranularityMin = DEFAULT_GRANULARITY_MIN,
      defaultVoteMode = EventVoteMode.AVAILABLE,
      votingDeadline,
      lineGroupId,
      expectedLineUserIds,
    } = createEventDto;

    const uniqueLineUserIds = expectedLineUserIds?.length
      ? [...new Set(expectedLineUserIds)]
      : [];

    this.validateTimes(startTime, endTime);
    if (votingDeadline) {
      this.validateVotingDeadline(votingDeadline);
    }

    const startMinuteOfDay = this.timeSlotService.parseTimeToMinutes(startTime);
    // Handle "24:00" as end of day
    const endMinuteOfDay =
      endTime === '24:00'
        ? 24 * 60
        : this.timeSlotService.parseTimeToMinutes(endTime);
    const votingDeadlineObj = votingDeadline ? new Date(votingDeadline) : null;

    const participantData = uniqueLineUserIds.map((lineUserId) => ({
      lineUserId,
    }));

    if (type === EventType.RECURRING) {
      const result = await this.createRecurringEvent(
        {
          title,
          description,
          weekdays,
          startMinuteOfDay,
          endMinuteOfDay,
          slotDurationMin,
          timeZone,
          defaultGranularityMin,
          defaultVoteMode,
          votingDeadlineObj,
          lineGroupId,
        },
        participantData,
        userId,
      );
      return { eventId: result.event.id };
    }

    const result = await this.createOneTimeEvent(
      {
        title,
        description,
        startDate,
        endDate,
        startMinuteOfDay,
        endMinuteOfDay,
        slotDurationMin,
        timeZone,
        defaultGranularityMin,
        defaultVoteMode,
        votingDeadlineObj,
        lineGroupId,
      },
      participantData,
      userId,
    );

    return { eventId: result.event.id };
  }

  private async createRecurringEvent(
    input: {
      title?: string;
      description?: string;
      weekdays?: Weekday[];
      startMinuteOfDay: number;
      endMinuteOfDay: number;
      slotDurationMin: number;
      timeZone: string;
      defaultGranularityMin: number;
      defaultVoteMode: EventVoteMode;
      votingDeadlineObj: Date | null;
      lineGroupId?: string;
    },
    participantData: Array<{ lineUserId: string }>,
    userId?: string,
  ) {
    this.validateRecurringWeekdays(input.weekdays);

    const normalizedWeekdays = this.normalizeWeekdays(input.weekdays!);
    const slots = this.timeSlotService.generateRecurringTimeSlots(
      normalizedWeekdays,
      input.startMinuteOfDay,
      input.endMinuteOfDay,
      input.slotDurationMin,
    );

    return this.eventRepository.createRecurringWithSlotsAndParticipants(
      {
        title: input.title,
        description: input.description,
        type: EventType.RECURRING,
        ownerId: userId || null,
        startMinuteOfDay: input.startMinuteOfDay,
        endMinuteOfDay: input.endMinuteOfDay,
        slotDurationMin: input.slotDurationMin,
        timeZone: input.timeZone,
        defaultGranularityMin: input.defaultGranularityMin,
        defaultVoteMode: input.defaultVoteMode,
        votingDeadline: input.votingDeadlineObj,
        lineGroupId: input.lineGroupId || null,
        weekdays: normalizedWeekdays,
      },
      slots,
      participantData,
      userId,
    );
  }

  private async createOneTimeEvent(
    input: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      startMinuteOfDay: number;
      endMinuteOfDay: number;
      slotDurationMin: number;
      timeZone: string;
      defaultGranularityMin: number;
      defaultVoteMode: EventVoteMode;
      votingDeadlineObj: Date | null;
      lineGroupId?: string;
    },
    participantData: Array<{ lineUserId: string }>,
    userId?: string,
  ) {
    const oneTimeDateRange = this.requireOneTimeDateRange(
      input.startDate,
      input.endDate,
    );

    const startDateObj = new Date(oneTimeDateRange.startDate);
    const endDateObj = new Date(oneTimeDateRange.endDate);
    const slots = this.timeSlotService.generateTimeSlots(
      startDateObj,
      endDateObj,
      input.startMinuteOfDay,
      input.endMinuteOfDay,
      input.slotDurationMin,
    );

    return this.eventRepository.createWithSlotsAndParticipants(
      {
        title: input.title,
        description: input.description,
        type: EventType.ONE_TIME,
        ownerId: userId || null,
        startDate: startDateObj,
        endDate: endDateObj,
        startMinuteOfDay: input.startMinuteOfDay,
        endMinuteOfDay: input.endMinuteOfDay,
        slotDurationMin: input.slotDurationMin,
        timeZone: input.timeZone,
        defaultGranularityMin: input.defaultGranularityMin,
        defaultVoteMode: input.defaultVoteMode,
        votingDeadline: input.votingDeadlineObj,
        lineGroupId: input.lineGroupId || null,
      },
      slots,
      participantData,
      userId,
    );
  }

  /**
   * Validate the date range: startDate <= endDate
   */
  private requireOneTimeDateRange(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );
    }

    return { startDate, endDate };
  }

  /**
   * Validate the time range: startTime < endTime
   */
  private validateTimes(startTime: string, endTime: string) {
    const startMinutes = this.timeSlotService.parseTimeToMinutes(startTime);
    const endMinutes =
      endTime === '24:00'
        ? 24 * 60
        : this.timeSlotService.parseTimeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('Start time must be before end time');
    }
  }

  private validateRecurringWeekdays(weekdays?: Weekday[]) {
    if (!weekdays || weekdays.length === 0) {
      throw new BadRequestException(
        'Recurring events must include at least one weekday',
      );
    }

    if (weekdays.length > 7) {
      throw new BadRequestException(
        'Recurring events can include at most seven weekdays',
      );
    }
  }

  /**
   * Validate the voting deadline: only the format is checked.
   */
  private validateVotingDeadline(votingDeadline: string) {
    const deadline = new Date(votingDeadline);
    if (isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid voting deadline');
    }
  }

  private normalizeWeekdays(weekdays: Weekday[]) {
    const weekdayOrder: Weekday[] = [
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
      Weekday.SUNDAY,
    ];

    const deduped = [...new Set(weekdays)];
    return weekdayOrder.filter((weekday) => deduped.includes(weekday));
  }
}
