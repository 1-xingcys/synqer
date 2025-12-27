import { VoteMode } from "@/types/event";

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
}

export interface Participant {
  userId: string;
  displayName: string;
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
  participants: Participant[];
  onSave: (selectedSlotIds: string[], voteMode: VoteMode) => Promise<void>;
  initialSelectedIds?: string[];
  currentUserId?: string;
  eventId?: string;
}

export interface RectangleBounds {
  minDate: number;
  maxDate: number;
  minTime: number;
  maxTime: number;
}
