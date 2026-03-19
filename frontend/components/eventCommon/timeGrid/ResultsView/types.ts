import { EventSlotAxisType } from "@/types/event";
import { TimeSlot, Vote, Participant } from "../types";

export type ResultsAvailabilityMode = "available" | "unavailable";

export interface SlotRangeInfo {
  startDate: string;
  endDate: string;
  axisType: EventSlotAxisType;
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
  // Committed slot IDs to display with persistent highlight
  committedSlotIds?: Set<string>;
  // Staged slot IDs to display with draft highlight
  stagedSlotIds?: Set<string> | null;
  // Baseline slot IDs for the staged draft
  stagedBaselineSlotIds?: Set<string> | null;
}
