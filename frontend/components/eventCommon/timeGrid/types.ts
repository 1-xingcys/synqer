import {
  EventCapabilities,
  EventSlotAxisType,
  VoteMode,
  Weekday,
} from "@/types/event";

export type TimeGranularity = 15 | 30 | 60;

export interface GridAxisColumn {
  key: string;
  kind: "date" | "weekday";
  rawValue: string;
  axisWeekday?: Weekday;
}

export interface MergedTimeRow {
  startMinute: number;
  endMinute: number;
  slotIndices: number[]; // indices of the original 15-min slots
  height: number; // relative height (1 = 15min, 2 = 30min, 4 = 60min)
}

export interface TimeSlot {
  id: string;
  axisType: EventSlotAxisType;
  axisDate?: string | null;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
  index: number;
}

export interface Vote {
  slotId: string;
  userId: string;
  userDisplayName: string;
  pictureUrl?: string;
}

export interface StagedVote {
  slotIds: string[];
  baselineSlotIds: string[];
  updatedAt: string;
}

export interface Participant {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
}

export interface VotingGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  stagedVote: StagedVote | null;
  currentUserHasVoted: boolean;
  currentUserId: string;
  eventId: string;
  eventTitle: string;
  timeZone: string;
  capabilities: EventCapabilities;
  defaultGranularity: TimeGranularity;
  defaultVoteMode: VoteMode;
  /** Host preference: whether committing a vote posts a notice into the chat. */
  shareVoteToChat: boolean;
}

export interface SlotMatrixCellViewModel {
  key: string;
  slot: TimeSlot;
  rowIndex: number;
  dateIndex: number;
  mergedSlotIds: string[];
  isSelected: boolean;
  isPartiallySelected: boolean;
  selectionTone: "none" | "committed" | "staged";
  isHovered: boolean;
  isLongPressed: boolean;
  inRectangle: boolean;
  voters: string[];
  slotCalendarEvents: CalendarEvent[];
  eventSpanById: Map<string, number>;
}

export interface SlotMatrixRowViewModel {
  rowIndex: number;
  cells: SlotMatrixCellViewModel[];
}
