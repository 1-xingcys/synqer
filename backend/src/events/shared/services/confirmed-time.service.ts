import { Injectable } from '@nestjs/common';
import { Weekday } from '@prisma/client';
import {
  ConfirmedSelection,
  ConfirmedSelectionKind,
  ConfirmedTimeSlotData,
} from '../interfaces/confirmed-time.interface';

type OneTimeConfirmedRange = {
  startTime: Date;
  endTime: Date;
  slotIds: string[];
};

/**
 * 確認時間處理服務
 * 負責將多個時段合併成連續的時間範圍
 */
@Injectable()
export class ConfirmedTimeService {
  private static readonly WEEKDAY_ORDER: Weekday[] = [
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY,
    Weekday.SATURDAY,
    Weekday.SUNDAY,
  ];

  /**
   * 將確認的時段合併成連續的時間範圍
   * 連續的時段（同一天且時間相連）會被合併
   */
  mergeToTimeRanges(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): OneTimeConfirmedRange[] {
    if (!confirmedTimeSlots || confirmedTimeSlots.length === 0) {
      return [];
    }

    // 按日期和開始時間排序
    const sortedSlots = [...confirmedTimeSlots].sort((a, b) => {
      const dateA = new Date(a.slot.date).getTime();
      const dateB = new Date(b.slot.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.slot.startMinute - b.slot.startMinute;
    });

    const ranges: OneTimeConfirmedRange[] = [];
    let currentRange: OneTimeConfirmedRange | null = null;

    for (const cts of sortedSlots) {
      const slotDate = new Date(cts.slot.date);
      const slotStartTime = this.createDateTime(slotDate, cts.slot.startMinute);
      const slotEndTime = this.createDateTime(slotDate, cts.slot.endMinute);

      if (!currentRange) {
        // 開始新的範圍
        currentRange = {
          startTime: slotStartTime,
          endTime: slotEndTime,
          slotIds: [cts.slotId],
        };
      } else {
        // 檢查是否可以合併（結束時間等於新時段的開始時間）
        if (currentRange.endTime.getTime() === slotStartTime.getTime()) {
          // 合併：延長結束時間
          currentRange.endTime = slotEndTime;
          currentRange.slotIds.push(cts.slotId);
        } else {
          // 不連續：儲存當前範圍，開始新的
          ranges.push(currentRange);
          currentRange = {
            startTime: slotStartTime,
            endTime: slotEndTime,
            slotIds: [cts.slotId],
          };
        }
      }
    }

    // 不要忘記最後一個範圍
    if (currentRange) {
      ranges.push(currentRange);
    }

    return ranges;
  }

  mergeToSelections(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): ConfirmedSelection[] {
    if (!confirmedTimeSlots || confirmedTimeSlots.length === 0) {
      return [];
    }

    const isRecurring = confirmedTimeSlots.some(
      (cts) => cts.slot.axisType === 'WEEKDAY' && cts.slot.axisWeekday != null,
    );

    if (!isRecurring) {
      return this.mergeToTimeRanges(confirmedTimeSlots).map((range) => ({
        kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
        startTime: range.startTime,
        endTime: range.endTime,
        slotIds: range.slotIds,
      }));
    }

    const sortedSlots = [...confirmedTimeSlots].sort((left, right) => {
      const leftWeekday = left.slot.axisWeekday;
      const rightWeekday = right.slot.axisWeekday;

      if (leftWeekday && rightWeekday) {
        const weekdayDiff =
          ConfirmedTimeService.WEEKDAY_ORDER.indexOf(leftWeekday) -
          ConfirmedTimeService.WEEKDAY_ORDER.indexOf(rightWeekday);
        if (weekdayDiff !== 0) {
          return weekdayDiff;
        }
      }

      if (left.slot.startMinute !== right.slot.startMinute) {
        return left.slot.startMinute - right.slot.startMinute;
      }

      return left.slot.endMinute - right.slot.endMinute;
    });

    const selections: ConfirmedSelection[] = [];
    let currentSelection: ConfirmedSelection | null = null;

    for (const cts of sortedSlots) {
      const weekday = cts.slot.axisWeekday;

      if (!weekday) {
        continue;
      }

      if (
        currentSelection &&
        currentSelection.kind === ConfirmedSelectionKind.WEEKDAY_RANGE &&
        currentSelection.weekday === weekday &&
        currentSelection.endMinute === cts.slot.startMinute
      ) {
        currentSelection.endMinute = cts.slot.endMinute;
        currentSelection.slotIds.push(cts.slotId);
        continue;
      }

      if (currentSelection) {
        selections.push(currentSelection);
      }

      currentSelection = {
        kind: ConfirmedSelectionKind.WEEKDAY_RANGE,
        weekday,
        startMinute: cts.slot.startMinute,
        endMinute: cts.slot.endMinute,
        slotIds: [cts.slotId],
      };
    }

    if (currentSelection) {
      selections.push(currentSelection);
    }

    return selections;
  }
  /**
   * 建立完整的 DateTime
   * 使用 setUTCHours 確保在任何伺服器時區都能正確處理時間
   * （資料庫中的 date 欄位是 UTC 時間）
   */
  private createDateTime(date: Date, minuteOfDay: number): Date {
    const result = new Date(date);
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    result.setUTCHours(hours, minutes, 0, 0);
    return result;
  }
}
