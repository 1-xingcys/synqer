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

export interface SlotRangeInfo {
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotIds: string[];
}

export interface ResultsViewProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  // Host-only props for adding time ranges to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo, availableCount: number) => void;
  // Selected slot IDs to display with border highlight
  selectedSlotIds?: Set<string>;
}

export type TimeGranularity = 15 | 30 | 60;

export interface MergedTimeRow {
  startMinute: number;
  endMinute: number;
  slotIndices: number[];
  height: number;
}
