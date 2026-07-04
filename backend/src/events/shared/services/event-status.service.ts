import { Injectable } from '@nestjs/common';
import { EventSlotAxisType, EventType } from '@prisma/client';
import { ConfirmedTimeSlotData } from '../interfaces/confirmed-time.interface';
import { zonedWallClockToInstant } from '../../../common/time';

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
 * 活動和參與者狀態計算服務（純邏輯，不存取資料庫）
 */
@Injectable()
export class EventStatusService {
  /**
   * 根據活動資訊計算活動狀態
   * @param event 活動資訊，包含 confirmedTimeSlots（已確認的時段）
   */
  computeEventStatus(
    event: {
      eventType: EventType;
      votingDeadline: Date | null;
      timeZone: string;
      confirmedTimeSlots?: ConfirmedTimeSlotData[];
    },
    now: Date = new Date(),
  ): EventStatus {
    const hasConfirmedSlots =
      event.confirmedTimeSlots && event.confirmedTimeSlots.length > 0;

    // 如果有確認的活動時段
    if (hasConfirmedSlots) {
      if (event.eventType === EventType.RECURRING) {
        return EventStatus.CONFIRMED;
      }

      // 找出最晚的時段結束時間（真實 instant）
      const latestEndTime = this.getLatestEndTime(
        event.confirmedTimeSlots!,
        event.timeZone,
      );
      if (latestEndTime && now > latestEndTime) {
        return EventStatus.COMPLETED;
      }
      return EventStatus.CONFIRMED;
    }

    // 如果沒有確認的活動時段，檢查投票截止時間
    if (event.votingDeadline) {
      // votingDeadline 以 naive 牆上數字儲存；解析成真實 instant 再與真實 now 比較。
      const deadlineInstant = zonedWallClockToInstant(
        event.votingDeadline,
        event.timeZone,
      );
      if (now > deadlineInstant) {
        return EventStatus.VOTING_ENDED;
      }
    }

    // 預設狀態：正在投票
    return EventStatus.VOTING;
  }

  /**
   * 計算確認時段中最晚的結束時間，並解析成真實 instant
   */
  private getLatestEndTime(
    slots: ConfirmedTimeSlotData[],
    timeZone: string,
  ): Date | null {
    if (slots.length === 0) return null;

    let latestEnd: Date | null = null;

    for (const slot of slots) {
      if (
        slot.slot.axisType !== EventSlotAxisType.DATE ||
        !slot.slot.axisDate
      ) {
        continue;
      }

      // 先組出「牆上數字放進 UTC 欄位」的 naive 結束時間，再解析成真實 instant。
      const wallEnd = new Date(slot.slot.axisDate);
      const endHours = Math.floor(slot.slot.endMinute / 60);
      const endMins = slot.slot.endMinute % 60;
      wallEnd.setUTCHours(endHours, endMins, 0, 0);
      const endInstant = zonedWallClockToInstant(wallEnd, timeZone);

      if (!latestEnd || endInstant > latestEnd) {
        latestEnd = endInstant;
      }
    }

    return latestEnd;
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
