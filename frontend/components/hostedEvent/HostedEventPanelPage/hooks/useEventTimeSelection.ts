"use client";

import { useMemo } from "react";
import { SelectedTimeRange } from "../EventTimeSelector";
import { ConfirmedTimeRange } from "@/types/event";

interface UseEventTimeSelectionOptions {
  totalParticipants: number;
  confirmedSlotIds?: string[];
  confirmedTimeRanges?: ConfirmedTimeRange[];
  isResetMode: boolean;
}

interface UseEventTimeSelectionReturn {
  /** 已確認的時間範圍（轉換為 SelectedTimeRange 格式） */
  confirmedTimeRangesDisplay: SelectedTimeRange[];
  /** 所有已確認的 slot IDs（用於 grid 高亮） */
  selectedSlotIdsSet: Set<string>;
}

export function useEventTimeSelection({
  totalParticipants,
  confirmedSlotIds,
  confirmedTimeRanges,
  isResetMode,
}: UseEventTimeSelectionOptions): UseEventTimeSelectionReturn {
  // Convert confirmed time ranges to SelectedTimeRange format for display
  const confirmedTimeRangesDisplay = useMemo((): SelectedTimeRange[] => {
    if (isResetMode || !confirmedTimeRanges || confirmedTimeRanges.length === 0)
      return [];

    return confirmedTimeRanges.map((range) => {
      const startDate = new Date(range.startTime);
      const endDate = new Date(range.endTime);

      // 後端使用 UTC 時間儲存，需要用 UTC 方法取得時間
      return {
        id: `confirmed-${range.slotIds.join("-")}`,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        startTime: startDate.getUTCHours() * 60 + startDate.getUTCMinutes(),
        endTime: endDate.getUTCHours() * 60 + endDate.getUTCMinutes(),
        slotIds: range.slotIds,
        availableCount: 0, // 已確認的時間不需要顯示 available
        totalParticipants,
        isConfirmed: true,
      };
    });
  }, [confirmedTimeRanges, isResetMode, totalParticipants]);

  // Get all confirmed slot IDs as a Set (for grid highlight)
  const selectedSlotIdsSet = useMemo(() => {
    const slotIdSet = new Set<string>();
    // Add confirmed slot IDs from the event (unless in reset mode)
    if (!isResetMode && confirmedSlotIds) {
      confirmedSlotIds.forEach((id) => slotIdSet.add(id));
    }
    return slotIdSet;
  }, [confirmedSlotIds, isResetMode]);

  return {
    confirmedTimeRangesDisplay,
    selectedSlotIdsSet,
  };
}
