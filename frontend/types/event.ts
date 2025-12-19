// 活動狀態
export enum EventStatus {
  VOTING = "VOTING", // 正在進行投票 (活動創建後 ~ 投票 deadline)
  VOTING_ENDED = "VOTING_ENDED", // 已經投票結束 (投票 deadline 已過，但 host 還沒決定活動時間)
  CONFIRMED = "CONFIRMED", // 活動時間已定 (host 決定活動時間 ~ 活動時間結束)
  COMPLETED = "COMPLETED", // 活動時間已過 (活動已經辦完)
}

// 參與者狀態
export enum ParticipantStatus {
  VOTED = "VOTED", // 已經投票
  NOT_VOTED = "NOT_VOTED", // 還沒投票（已註冊）
  NOT_REGISTERED = "NOT_REGISTERED", // 還沒註冊（只有 LINE 使用者）
}

// 活動列表項目（用於 hosted 和 joined 頁面）
export interface EventListItem {
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  participantCount: number;
  votingDeadline: string | null;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  status: EventStatus;
}

// 參與的活動項目（包含是否已投票）
export interface AttendedEventListItem extends EventListItem {
  hasVoted: boolean;
}

// 預期參與者
export interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted: boolean;
  status: ParticipantStatus;
}
