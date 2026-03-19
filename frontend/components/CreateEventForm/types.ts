import type { EventType, Weekday } from "@/types/event";

export const MIN_HOURS_BEFORE_EVENT = 1;
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

  // Displayed voting deadline fields
  votingDeadline: Date | null;
  votingDeadlineTime: string;
  votingDeadlineManuallySet: boolean;

  // One-time event draft
  oneTimeVotingDeadline: Date | null;
  oneTimeVotingDeadlineTime: string;
  oneTimeVotingDeadlineManuallySet: boolean;

  // Recurring event draft
  recurringVotingDeadline: Date | null;
  recurringVotingDeadlineTime: string;
  recurringVotingDeadlineManuallySet: boolean;
  lineGroupId: string | null;
  selectedLineUserIds: string[];
}
