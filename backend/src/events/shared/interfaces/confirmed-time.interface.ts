/**
 * 確認時段的原始資料結構
 */
export interface ConfirmedTimeSlotData {
  slotId: string;
  slot: {
    id: string;
    date: Date;
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
