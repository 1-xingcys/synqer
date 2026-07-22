import type { EventType, Weekday } from "@/types/event";

export const TITLE_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 500;

export const DEFAULT_EVENT_TYPE: EventType = "ONE_TIME";
export const DEFAULT_WEEKDAYS: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

export interface CreateEventFormData {
  eventType: EventType;
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
  timeZone: string;

  // Voting deadline fields
  votingDeadlineEnabled: boolean;
  votingDeadline: Date | null;
  votingDeadlineTime: string | null;
  lineGroupId: string | null;
  selectedLineUserIds: string[];
}
