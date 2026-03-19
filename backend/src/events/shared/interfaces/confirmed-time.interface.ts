import { EventSlotAxisType, Weekday } from '@prisma/client';

/**
 * 確認時段的原始資料結構
 */
export interface ConfirmedTimeSlotData {
  slotId: string;
  slot: {
    id: string;
    axisType: EventSlotAxisType;
    axisDate: Date | null;
    axisWeekday: Weekday | null;
    startMinute: number;
    endMinute: number;
  };
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
