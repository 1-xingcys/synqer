import { EventSlotAxisType, Weekday } from '@prisma/client';

/**
 * 確認時段的原始資料結構
 */
export interface ConfirmedTimeSlotData {
  slotId: string;
  slot: {
    id: string;
    date: Date;
    axisType?: EventSlotAxisType | null;
    axisWeekday?: Weekday | null;
    startMinute: number;
    endMinute: number;
  };
}

/**
 * 合併後的時間範圍
 * 連續的時段會被合併成一個範圍
 */
export interface ConfirmedTimeRange {
  startTime: Date; // 開始時間（完整的 DateTime）
  endTime: Date; // 結束時間（完整的 DateTime）
  slotIds: string[]; // 包含的時段 ID
}

export const ConfirmedSelectionKind = {
  ONE_TIME_RANGE: 'ONE_TIME_RANGE',
  WEEKDAY_RANGE: 'WEEKDAY_RANGE',
} as const;

export type ConfirmedSelectionKind =
  (typeof ConfirmedSelectionKind)[keyof typeof ConfirmedSelectionKind];

export interface OneTimeConfirmedSelection {
  kind: typeof ConfirmedSelectionKind.ONE_TIME_RANGE;
  startTime: Date;
  endTime: Date;
  slotIds: string[];
}

export interface RecurringConfirmedSelection {
  kind: typeof ConfirmedSelectionKind.WEEKDAY_RANGE;
  weekday: Weekday;
  startMinute: number;
  endMinute: number;
  slotIds: string[];
}

export type ConfirmedSelection =
  | OneTimeConfirmedSelection
  | RecurringConfirmedSelection;
