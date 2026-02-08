export type TimeGranularity = 15 | 30 | 60;

export interface MergedTimeRow {
  startMinute: number;
  endMinute: number;
  slotIndices: number[]; // indices of the original 15-min slots
  height: number; // relative height (1 = 15min, 2 = 30min, 4 = 60min)
}

export interface TimeSlot {
  id: string;
  date: string;
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

export interface GridPosition {
  dateIndex: number;
  timeIndex: number;
}

export interface VotingGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  currentUserId: string;
  currentUserDisplayName: string;
  eventId: string;
}

export interface RectangleBounds {
  minDate: number;
  maxDate: number;
  minTime: number;
  maxTime: number;
}

export interface SlotMatrixCellViewModel {
  key: string;
  slot: TimeSlot;
  rowIndex: number;
  dateIndex: number;
  mergedSlotIds: string[];
  isSelected: boolean;
  isPartiallySelected: boolean;
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
