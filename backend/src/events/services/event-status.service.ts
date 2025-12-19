import { Injectable } from '@nestjs/common';

// 活動狀態
export enum EventStatus {
  VOTING = 'VOTING', // 正在進行投票 (活動創建後 ~ 投票 deadline)
  VOTING_ENDED = 'VOTING_ENDED', // 已經投票結束 (投票 deadline 已過，但 host 還沒決定活動時間)
  CONFIRMED = 'CONFIRMED', // 活動時間已定 (host 決定活動時間 ~ 活動時間結束)
  COMPLETED = 'COMPLETED', // 活動時間已過 (活動已經辦完)
}

// 參與者狀態
export enum ParticipantStatus {
  VOTED = 'VOTED', // 已經投票
  NOT_VOTED = 'NOT_VOTED', // 還沒投票（已註冊）
  NOT_REGISTERED = 'NOT_REGISTERED', // 還沒註冊（只有 LINE 使用者）
}

/**
 * 活動和參與者狀態計算服務
 */
@Injectable()
export class EventStatusService {
  /**
   * 根據活動資訊計算活動狀態
   */
  computeEventStatus(event: {
    votingDeadline: Date | null;
    confirmedStartTime: Date | null;
    confirmedEndTime: Date | null;
  }): EventStatus {
    const now = new Date();

    // 如果有確認的活動時間
    if (event.confirmedStartTime && event.confirmedEndTime) {
      // 檢查活動是否已結束
      if (now > event.confirmedEndTime) {
        return EventStatus.COMPLETED;
      }
      return EventStatus.CONFIRMED;
    }

    // 如果沒有確認的活動時間，檢查投票截止時間
    if (event.votingDeadline) {
      if (now > event.votingDeadline) {
        return EventStatus.VOTING_ENDED;
      }
    }

    // 預設狀態：正在投票
    return EventStatus.VOTING;
  }

  /**
   * 根據參與者資訊計算參與者狀態
   */
  computeParticipantStatus(participant: {
    userId: string | null;
    lineUserId: string | null;
    hasVoted: boolean;
  }): ParticipantStatus {
    // 如果已經投票
    if (participant.hasVoted) {
      return ParticipantStatus.VOTED;
    }

    // 如果有 userId 但還沒投票
    if (participant.userId) {
      return ParticipantStatus.NOT_VOTED;
    }

    // 如果只有 lineUserId 但沒有 userId（還沒註冊）
    if (participant.lineUserId) {
      return ParticipantStatus.NOT_REGISTERED;
    }

    // 預設狀態
    return ParticipantStatus.NOT_VOTED;
  }
}
