import { VoteMode } from "@/types/event";

// Re-export shared types from common hooks
export type {
  TimeGranularity,
  MergedTimeRow,
} from "@/components/eventCommon/hooks";

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
