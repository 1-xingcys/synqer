import type { components } from "@/generated/openapi";

export type EventType = components["schemas"]["EventType"];
export type Weekday = components["schemas"]["Weekday"];
export type EventSlotAxisType = components["schemas"]["EventSlotAxisType"];

// 活動狀態
export const EventStatus = {
  VOTING: "VOTING", // 正在進行投票 (活動創建後 ~ 投票 deadline)
  VOTING_ENDED: "VOTING_ENDED", // 已經投票結束 (投票 deadline 已過，但 host 還沒決定活動時間)
  CONFIRMED: "CONFIRMED", // 活動時間已定 (host 決定活動時間 ~ 活動時間結束)
  COMPLETED: "COMPLETED", // 活動時間已過 (活動已經辦完)
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

// 參與者狀態
export const ParticipantStatus = {
  VOTED: "VOTED", // 已經投票
  NOT_VOTED: "NOT_VOTED", // 還沒投票（已註冊）
  NOT_REGISTERED: "NOT_REGISTERED", // 還沒註冊（只有 LINE 使用者）
} as const;
export type ParticipantStatus =
  (typeof ParticipantStatus)[keyof typeof ParticipantStatus];

// 投票模式
export const VoteMode = {
  AVAILABLE: "available", // 可參加
  UNAVAILABLE: "unavailable", // 不可參加
} as const;
export type VoteMode = (typeof VoteMode)[keyof typeof VoteMode];

// 合併後的時間範圍（連續時段合併成一個範圍）
export type ConfirmedTimeRange = components["schemas"]["ConfirmedTimeRangeDto"];
export type EventCapabilities = components["schemas"]["EventCapabilitiesDto"];

export type StagedConfirmation =
  components["schemas"]["HostedEventStagedConfirmationDto"];

export interface EventWithCapabilities {
  capabilities: EventCapabilities;
}

export interface OneTimeEventSchedule {
  kind: "ONE_TIME";
  startDate: string;
  endDate: string;
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  slotDurationMin?: number;
}

export interface RecurringEventSchedule {
  kind: "RECURRING";
  weekdays?: Weekday[];
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  slotDurationMin?: number;
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

// 預期參與者
export interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted: boolean;
  status: ParticipantStatus;
}
