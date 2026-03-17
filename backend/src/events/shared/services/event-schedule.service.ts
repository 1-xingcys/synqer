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
  startDate?: Date | null;
  endDate?: Date | null;
  startMinuteOfDay?: number | null;
  endMinuteOfDay?: number | null;
  slotDurationMin?: number | null;
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

    return {
      type: EventType.ONE_TIME,
      startDate:
        event.oneTimeSchedule?.startDate ?? event.startDate ?? undefined,
      endDate: event.oneTimeSchedule?.endDate ?? event.endDate ?? undefined,
      startMinuteOfDay:
        event.oneTimeSchedule?.startMinuteOfDay ?? event.startMinuteOfDay ?? 0,
      endMinuteOfDay:
        event.oneTimeSchedule?.endMinuteOfDay ?? event.endMinuteOfDay ?? 0,
      slotDurationMin:
        event.oneTimeSchedule?.slotDurationMin ?? event.slotDurationMin ?? 15,
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
