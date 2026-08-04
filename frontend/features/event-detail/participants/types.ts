export interface SelectedParticipant {
  id?: string;
  lineUserId?: string;
  userId?: string;
  displayName: string;
  pictureUrl?: string | null;
  hasVoted?: boolean;
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
  isFromGroup: boolean; // 是否為群組成員
}
