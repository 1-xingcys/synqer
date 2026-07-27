import type { components } from "@/generated/openapi";
import type { CalendarDay } from "@/lib/calendarDay";

export type EventType = components["schemas"]["EventType"];
export type Weekday = components["schemas"]["Weekday"];
export type EventSlotAxisType = components["schemas"]["EventSlotAxisType"];
export type ConfirmedSelectionKind =
  components["schemas"]["ConfirmedSelectionKind"];
/** Wire format of the host's default vote mode (uppercase, unlike `VoteMode`). */
export type EventVoteModeDto = components["schemas"]["EventVoteMode"];

export const EventStatus = {
  VOTING: "VOTING", // Voting is open (event created ~ voting deadline)
  VOTING_ENDED: "VOTING_ENDED", // Voting is over (deadline passed, but the host has not picked a time yet)
  CONFIRMED: "CONFIRMED", // Event time is set (host picked a time ~ event time ends)
  COMPLETED: "COMPLETED", // Event time has passed (the event is over)
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const ParticipantStatus = {
  VOTED: "VOTED", // Has voted
  NOT_VOTED: "NOT_VOTED", // Has not voted (registered)
  NOT_REGISTERED: "NOT_REGISTERED", // Not registered (LINE user only)
} as const;
export type ParticipantStatus =
  (typeof ParticipantStatus)[keyof typeof ParticipantStatus];

// Vote mode
export const VoteMode = {
  AVAILABLE: "available", // Can attend
  UNAVAILABLE: "unavailable", // Cannot attend
} as const;
export type VoteMode = (typeof VoteMode)[keyof typeof VoteMode];

// Merged time ranges (consecutive slots merged into a single range)
export type ConfirmedSelection = components["schemas"]["ConfirmedSelectionDto"];
export type EventCapabilities = components["schemas"]["EventCapabilitiesDto"];

export type StagedConfirmation =
  components["schemas"]["HostedEventStagedConfirmationDto"];

export interface EventWithCapabilities {
  capabilities: EventCapabilities;
}

export interface OneTimeEventSchedule {
  kind: "ONE_TIME";
  /** Candidate days, normalised at the API boundary (see event-normalizers). */
  startDate: CalendarDay;
  endDate: CalendarDay;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
}

export interface RecurringEventSchedule {
  kind: "RECURRING";
  weekdays: Weekday[];
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
}

export type EventSchedule = OneTimeEventSchedule | RecurringEventSchedule;

export function supportsCompletion(event: EventWithCapabilities): boolean {
  return event.capabilities.supportsCompletion;
}

export function supportsCalendarConflict(
  event: EventWithCapabilities,
): boolean {
  return event.capabilities.supportsCalendarConflict;
}

export function supportsAddToCalendar(event: EventWithCapabilities): boolean {
  return event.capabilities.supportsAddToCalendar;
}

// Expected participant
export interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted: boolean;
  status: ParticipantStatus;
}
