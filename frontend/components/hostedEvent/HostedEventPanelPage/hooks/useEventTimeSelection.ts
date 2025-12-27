"use client";

import { useState, useMemo, useCallback } from "react";
import { SlotRangeInfo } from "@/components/eventCommon/timeGrid/ResultsView";
import { SelectedTimeRange } from "../EventTimeSelector";
import { ConfirmedTimeRange } from "@/types/event";

interface UseEventTimeSelectionOptions {
  totalParticipants: number;
  confirmedSlotIds?: string[];
  confirmedTimeRanges?: ConfirmedTimeRange[];
  isResetMode: boolean;
}

interface UseEventTimeSelectionReturn {
  /** 使用者新選的時間範圍 */
  userSelectedTimeRanges: SelectedTimeRange[];
  /** 合併後的所有時間範圍（已確認 + 使用者新選） */
  allTimeRanges: SelectedTimeRange[];
  /** 所有選中的 slot IDs（用於 grid 高亮） */
  selectedSlotIdsSet: Set<string>;
  /** 是否有任何選擇 */
  hasAnySelection: boolean;
  /** 使用者是否有新選擇（用於判斷是否顯示確認按鈕） */
  hasUserSelection: boolean;
  addTimeRange: (info: SlotRangeInfo, availableCount: number) => void;
  removeTimeRange: (id: string) => void;
  clearSelections: () => void;
  getAllSelectedSlotIds: () => string[];
}

export function useEventTimeSelection({
  totalParticipants,
  confirmedSlotIds,
  confirmedTimeRanges,
  isResetMode,
}: UseEventTimeSelectionOptions): UseEventTimeSelectionReturn {
  const [userSelectedTimeRanges, setUserSelectedTimeRanges] = useState<
    SelectedTimeRange[]
  >([]);

  // Convert confirmed time ranges to SelectedTimeRange format
  const confirmedAsSelectedRanges = useMemo((): SelectedTimeRange[] => {
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

  // Merge confirmed and user-selected time ranges
  const allTimeRanges = useMemo(() => {
    return [...confirmedAsSelectedRanges, ...userSelectedTimeRanges];
  }, [confirmedAsSelectedRanges, userSelectedTimeRanges]);

  // Get all slot IDs from selected ranges as a Set (for display)
  // Also include confirmed slot IDs from the event (unless in reset mode)
  const selectedSlotIdsSet = useMemo(() => {
    const slotIdSet = new Set<string>();
    // Add user-selected time ranges
    userSelectedTimeRanges.forEach((range) => {
      range.slotIds.forEach((id) => slotIdSet.add(id));
    });
    // Add already confirmed slot IDs from the event (unless in reset mode)
    if (!isResetMode && confirmedSlotIds) {
      confirmedSlotIds.forEach((id) => slotIdSet.add(id));
    }
    return slotIdSet;
  }, [userSelectedTimeRanges, confirmedSlotIds, isResetMode]);

  const hasAnySelection = selectedSlotIdsSet.size > 0;
  const hasUserSelection = userSelectedTimeRanges.length > 0;

  // Handle adding a time range to selected event times
  const addTimeRange = useCallback(
    (info: SlotRangeInfo, availableCount: number) => {
      // Generate a unique ID for this range
      const rangeId = `${info.startDate}-${info.startTime}-${info.endDate}-${info.endTime}`;

      setUserSelectedTimeRanges((prev) => {
        // Check if this range already exists (to prevent duplicates)
        const exists = prev.some((r) => r.id === rangeId);
        if (exists) return prev;

        const newRange: SelectedTimeRange = {
          id: rangeId,
          startDate: info.startDate,
          endDate: info.endDate,
          startTime: info.startTime,
          endTime: info.endTime,
          slotIds: info.slotIds,
          availableCount,
          totalParticipants,
          isConfirmed: false,
        };

        return [...prev, newRange];
      });
    },
    [totalParticipants],
  );

  // Handle removing a time range (only user-selected can be removed)
  const removeTimeRange = useCallback((id: string) => {
    setUserSelectedTimeRanges((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Clear all user selections
  const clearSelections = useCallback(() => {
    setUserSelectedTimeRanges([]);
  }, []);

  // Get all slot IDs from selected ranges as an array (for API)
  const getAllSelectedSlotIds = useCallback(() => {
    return Array.from(selectedSlotIdsSet);
  }, [selectedSlotIdsSet]);

  return {
    userSelectedTimeRanges,
    allTimeRanges,
    selectedSlotIdsSet,
    hasAnySelection,
    hasUserSelection,
    addTimeRange,
    removeTimeRange,
    clearSelections,
    getAllSelectedSlotIds,
  };
}
