import { Injectable } from '@nestjs/common';
import { EventType, Weekday } from '@prisma/client';
import { EventScheduleSummary } from '../interfaces/event-contract.interface';

export type OneTimeScheduleRecord = {
  startDate: Date;
  endDate: Date;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
};

export type RecurringScheduleRecord = {
  weekdays: Weekday[];
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
};

export type EventScheduleSource = {
  type: EventType;
  oneTimeSchedule?: OneTimeScheduleRecord | null;
  recurringSchedule?: RecurringScheduleRecord | null;
};

@Injectable()
export class EventScheduleService {
  resolveSchedule(event: EventScheduleSource): EventScheduleSummary {
    if (event.type === EventType.RECURRING && event.recurringSchedule) {
      return {
        type: EventType.RECURRING,
        weekdays: event.recurringSchedule.weekdays,
        startMinuteOfDay: event.recurringSchedule.startMinuteOfDay,
        endMinuteOfDay: event.recurringSchedule.endMinuteOfDay,
        slotDurationMin: event.recurringSchedule.slotDurationMin,
      };
    }

    if (!event.oneTimeSchedule) {
      throw new Error('One-time event is missing oneTimeSchedule');
    }

    return {
      type: EventType.ONE_TIME,
      startDate: event.oneTimeSchedule.startDate,
      endDate: event.oneTimeSchedule.endDate,
      startMinuteOfDay: event.oneTimeSchedule.startMinuteOfDay,
      endMinuteOfDay: event.oneTimeSchedule.endMinuteOfDay,
      slotDurationMin: event.oneTimeSchedule.slotDurationMin,
    };
  }

  getEventStartInstant(event: EventScheduleSource): Date | null {
    const schedule = this.resolveSchedule(event);

    if (schedule.type !== EventType.ONE_TIME || !schedule.startDate) {
      return null;
    }

    const eventStart = new Date(schedule.startDate);
    eventStart.setUTCHours(0, 0, 0, 0);
    eventStart.setUTCMinutes(schedule.startMinuteOfDay);
    return eventStart;
  }

  getCalendarRange(event: EventScheduleSource) {
    const schedule = this.resolveSchedule(event);

    if (schedule.type !== EventType.ONE_TIME || !schedule.startDate) {
      return null;
    }

    const endDate = schedule.endDate ?? schedule.startDate;

    return {
      timeMin: schedule.startDate,
      timeMax: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
    };
  }
}
