import { Injectable } from '@nestjs/common';
import {
  ConfirmedTimeSlotData,
  ConfirmedTimeRange,
} from './confirmed-time.interface';

/**
 * 確認時間處理服務
 * 負責將多個時段合併成連續的時間範圍
 */
@Injectable()
export class ConfirmedTimeService {
  /**
   * 將確認的時段合併成連續的時間範圍
   * 連續的時段（同一天且時間相連）會被合併
   */
  mergeToTimeRanges(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): ConfirmedTimeRange[] {
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

    const ranges: ConfirmedTimeRange[] = [];
    let currentRange: ConfirmedTimeRange | null = null;

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

  /**
   * 格式化時間範圍為可讀字串（用於 LINE Bot 等）
   */
  formatTimeRange(range: ConfirmedTimeRange): string {
    const startDate = range.startTime;
    const endDate = range.endTime;

    const dateStr = this.formatDate(startDate);
    const startTimeStr = this.formatTime(startDate);
    const endTimeStr = this.formatTime(endDate);

    // 如果是同一天
    if (this.isSameDay(startDate, endDate)) {
      return `${dateStr} ${startTimeStr} - ${endTimeStr}`;
    }

    // 跨天的情況
    const endDateStr = this.formatDate(endDate);
    return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
  }

  /**
   * 格式化所有時間範圍為摘要字串
   * @param ranges 時間範圍陣列
   * @param maxDisplay 最多顯示幾個（用於預覽模式）
   */
  formatTimeRangesSummary(
    ranges: ConfirmedTimeRange[],
    maxDisplay?: number,
  ): string {
    if (ranges.length === 0) {
      return '';
    }

    if (maxDisplay && ranges.length > maxDisplay) {
      const displayed = ranges.slice(0, maxDisplay);
      const remaining = ranges.length - maxDisplay;
      const displayedStr = displayed
        .map((r) => this.formatTimeRange(r))
        .join('\n');
      return `${displayedStr}\n(+${remaining} 個時段)`;
    }

    return ranges.map((r) => this.formatTimeRange(r)).join('\n');
  }

  private formatDate(date: Date): string {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${month}/${day}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }
}
