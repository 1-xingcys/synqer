export type FilterType = "all" | "voted" | "notVoted";

export interface ParticipantItem {
  id: string;
  displayName: string;
  pictureUrl?: string;
  hasVoted: boolean;
}
