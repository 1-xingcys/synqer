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

export interface ResultsViewProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
}

export type TimeGranularity = 15 | 30 | 60;

export interface MergedTimeRow {
  startMinute: number;
  endMinute: number;
  slotIndices: number[];
  height: number;
}

