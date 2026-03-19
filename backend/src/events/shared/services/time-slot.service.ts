import { Injectable } from '@nestjs/common';
import { Weekday } from '@prisma/client';

type OneTimeSlot = { date: Date; startMinute: number; endMinute: number };
type RecurringSlot = {
  weekday: Weekday;
  startMinute: number;
  endMinute: number;
};

/**
 * 時間槽生成和處理服務（純邏輯，不存取資料庫）
 */
@Injectable()
export class TimeSlotService {
  /**
   * 工具：將時間字串轉換為分鐘數（例如 "09:00" -> 540）
   */
  parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 工具：展開所有時間格子
   * 從 startDate 到 endDate，每天從 startMinute 到 endMinute，以 slotDuration 切割
   */
  generateTimeSlots(
    startDate: Date,
    endDate: Date,
    startMinuteOfDay: number,
    endMinuteOfDay: number,
    slotDurationMin: number,
  ): OneTimeSlot[] {
    const slots: OneTimeSlot[] = [];

    // 遍歷每一天
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // 遍歷當天的每個時間段
      let currentMinute = startMinuteOfDay;
      while (currentMinute < endMinuteOfDay) {
        const nextMinute = Math.min(
          currentMinute + slotDurationMin,
          endMinuteOfDay,
        );
        slots.push({
          date: new Date(currentDate),
          startMinute: currentMinute,
          endMinute: nextMinute,
        });
        currentMinute = nextMinute;
      }

      // 移到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  generateRecurringTimeSlots(
    weekdays: Weekday[],
    startMinuteOfDay: number,
    endMinuteOfDay: number,
    slotDurationMin: number,
  ): RecurringSlot[] {
    const slots: RecurringSlot[] = [];

    for (const weekday of weekdays) {
      let currentMinute = startMinuteOfDay;

      while (currentMinute < endMinuteOfDay) {
        const nextMinute = Math.min(
          currentMinute + slotDurationMin,
          endMinuteOfDay,
        );
        slots.push({
          weekday,
          startMinute: currentMinute,
          endMinute: nextMinute,
        });
        currentMinute = nextMinute;
      }
    }

    return slots;
  }
}
