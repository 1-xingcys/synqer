import { ParticipantStatus } from "@/types/event";

export interface SelectedParticipant {
  id?: string;
  lineUserId?: string;
  userId?: string;
  displayName: string;
  pictureUrl?: string | null;
  hasVoted?: boolean;
  status?: ParticipantStatus;
}

export interface ParticipantListItem {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName: string;
  pictureUrl?: string | null;
  isSelected: boolean;
  isRegistered: boolean;
  hasVoted?: boolean;
}

export type EventMode = "lineGroup" | "search";
