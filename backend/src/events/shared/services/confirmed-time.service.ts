import { Injectable } from '@nestjs/common';
import { EventSlotAxisType, Weekday } from '@prisma/client';
import {
  ConfirmedSelection,
  ConfirmedSelectionKind,
  ConfirmedTimeSlotData,
} from '../interfaces/confirmed-time.interface';

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

  mergeToSelections(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): ConfirmedSelection[] {
    if (!confirmedTimeSlots || confirmedTimeSlots.length === 0) {
      return [];
    }

    const isRecurring = confirmedTimeSlots.some(
      (cts) =>
        cts.slot.axisType === EventSlotAxisType.WEEKDAY &&
        cts.slot.axisWeekday != null,
    );

    if (!isRecurring) {
      return this.mergeToOneTimeSelections(confirmedTimeSlots);
    }

    return this.mergeToRecurringSelections(confirmedTimeSlots);
  }

  private mergeToRecurringSelections(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): ConfirmedSelection[] {
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

      return left.slot.startMinute - right.slot.startMinute;
    });

    const selections: ConfirmedSelection[] = [];
    let currentSelection: ConfirmedSelection | null = null;

    for (const cts of sortedSlots) {
      const weekday = cts.slot.axisWeekday;

      if (cts.slot.axisType !== EventSlotAxisType.WEEKDAY || weekday == null) {
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

  private mergeToOneTimeSelections(
    confirmedTimeSlots: ConfirmedTimeSlotData[],
  ): ConfirmedSelection[] {
    const sortedSlots = [...confirmedTimeSlots].sort((a, b) => {
      const dateA = this.requireAxisDate(a).getTime();
      const dateB = this.requireAxisDate(b).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.slot.startMinute - b.slot.startMinute;
    });

    const selections: ConfirmedSelection[] = [];
    let currentSelection: ConfirmedSelection | null = null;

    for (const cts of sortedSlots) {
      if (cts.slot.axisType !== EventSlotAxisType.DATE) {
        continue;
      }

      const slotDate = new Date(this.requireAxisDate(cts));
      const slotStartTime = this.createDateTime(slotDate, cts.slot.startMinute);
      const slotEndTime = this.createDateTime(slotDate, cts.slot.endMinute);

      if (
        currentSelection &&
        currentSelection.kind === ConfirmedSelectionKind.ONE_TIME_RANGE &&
        currentSelection.endTime.getTime() === slotStartTime.getTime()
      ) {
        currentSelection.endTime = slotEndTime;
        currentSelection.slotIds.push(cts.slotId);
        continue;
      }

      if (currentSelection) {
        selections.push(currentSelection);
      }

      currentSelection = {
        kind: ConfirmedSelectionKind.ONE_TIME_RANGE,
        startTime: slotStartTime,
        endTime: slotEndTime,
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

  private requireAxisDate(slot: ConfirmedTimeSlotData): Date {
    if (!slot.slot.axisDate) {
      throw new Error(
        `Missing axisDate for DATE slot ${slot.slot.id} in confirmed time merge`,
      );
    }

    return slot.slot.axisDate;
  }
}
