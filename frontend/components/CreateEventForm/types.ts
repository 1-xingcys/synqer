import type { EventType, VoteMode, Weekday } from "@/types/event";
import type { TimeGranularity } from "@/components/eventCommon/timeGrid/types";

export const TITLE_MAX_LENGTH = 50;

/** LINE group binding is temporarily disabled; flip to true to restore it. */
export const LINE_GROUP_BINDING_ENABLED: boolean = false;

/** Default voting window: a plain 09:00-17:00 working day. */
export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_END_TIME = "17:00";

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

  // Grid view defaults participants start from
  defaultGranularityMin: TimeGranularity;
  defaultVoteMode: VoteMode;

  // Voting deadline fields
  votingDeadlineEnabled: boolean;
  votingDeadline: Date | null;
  votingDeadlineTime: string | null;
  /**
   * Set once the host edits the deadline by hand, which stops it from
   * tracking the event schedule. Not part of the unsaved-changes comparison.
   */
  votingDeadlineTouched: boolean;
  lineGroupId: string | null;
  selectedLineUserIds: string[];
}
