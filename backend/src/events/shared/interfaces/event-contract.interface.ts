import { EventType, Weekday } from '@prisma/client';

export interface EventCapabilities {
  supportsCompletion: boolean;
  supportsCalendarConflict: boolean;
  supportsAddToCalendar: boolean;
}

export interface EventScheduleSummary {
  type: EventType;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
  startDate?: Date;
  endDate?: Date;
  weekdays?: Weekday[];
}
