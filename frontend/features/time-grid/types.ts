import {
  EventCapabilities,
  EventSlotAxisType,
  TimeGranularity,
  VoteMode,
  Weekday,
} from "@/types/event";
import type { AxisSpan } from "@/lib/event/axisSpan";
import type { WallClock } from "@/lib/time";

export interface GridAxisColumn {
  /** Stable key for grouping and lookup; see axisSpanKey. */
  key: string;
  axis: AxisSpan;
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
  votingDeadline: WallClock | null;
}

/**
 * Everything `TimeSlotCell` renders from, and nothing else.
 *
 * Every field is either a primitive or a reference that only changes when the
 * underlying data changes — never on hover or on a drag step. That is what lets
 * `memo` skip the cells a drag did not touch; see slotMatrixCellModel.ts.
 */
export interface SlotMatrixCellViewModel {
  key: string;
  slot: TimeSlot;
  rowIndex: number;
  dateIndex: number;
  /** Comma-joined slot ids, pre-joined so the cell receives a primitive. */
  mergedSlotIdsAttr: string;
  isSelected: boolean;
  isPartiallySelected: boolean;
  selectionTone: "none" | "committed" | "staged";
  /** True only while a drag is in progress and this cell is inside the rectangle. */
  inRectangle: boolean;
  rectEdgeTop: boolean;
  rectEdgeBottom: boolean;
  rectEdgeLeft: boolean;
  rectEdgeRight: boolean;
  voters: string[];
  slotCalendarEvents: CalendarEvent[];
  eventSpanById: Map<string, number>;
}

export interface SlotMatrixRowViewModel {
  rowIndex: number;
  cells: SlotMatrixCellViewModel[];
}
