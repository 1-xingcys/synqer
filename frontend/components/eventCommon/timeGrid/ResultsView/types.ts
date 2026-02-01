import { TimeSlot, Vote, Participant } from "../types";

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
  // Event ID for share link
  eventId: string;
  // Host-only props for adding time ranges to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo) => Promise<boolean>;
  // Selected slot IDs to display with border highlight
  selectedSlotIds?: Set<string>;
}
