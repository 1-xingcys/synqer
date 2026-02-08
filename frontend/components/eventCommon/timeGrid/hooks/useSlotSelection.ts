"use client";

import { useState, useCallback } from "react";
import { TimeSlot } from "../types";
import { VoteMode } from "@/types/event";

interface UseSlotSelectionProps {
  slots: TimeSlot[];
  slotsByDate: Record<string, TimeSlot[]>;
  /** 從 React Query cache 派生的當前使用者已選 slot IDs */
  selectedSlots: Set<string>;
  /** 增量更新 callback */
  onSelectionCommit: (addSlotIds: string[], removeSlotIds: string[]) => void;
  /** 全量替換 callback（用於 selectAll / clearSelection） */
  onReplaceAll: (slotIds: string[]) => void;
}

interface UseSlotSelectionReturn {
  // State
  selectedSlots: Set<string>;
  voteMode: VoteMode;

  // Actions
  setVoteMode: (mode: VoteMode) => void;
  selectEntireDay: (dateKey: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  applyConflicts: (conflictingSlotIds: string[]) => void;
  isDayFullySelected: (dateKey: string, checkSet?: Set<string>) => boolean;
}

export function useSlotSelection({
  slots,
  slotsByDate,
  selectedSlots,
  onSelectionCommit,
  onReplaceAll,
}: UseSlotSelectionProps): UseSlotSelectionReturn {
  const [voteMode, setVoteModeState] = useState<VoteMode>(VoteMode.AVAILABLE);

  // Check if a day is fully selected
  const isDayFullySelected = useCallback(
    (dateKey: string, checkSet?: Set<string>) => {
      const daySlots = slotsByDate[dateKey] || [];
      const setToCheck = checkSet ?? selectedSlots;
      return (
        daySlots.length > 0 && daySlots.every((slot) => setToCheck.has(slot.id))
      );
    },
    [slotsByDate, selectedSlots],
  );

  // Select entire day — 增量更新
  const selectEntireDay = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      const allSelected = daySlots.every((slot) => selectedSlots.has(slot.id));
      const daySlotIds = daySlots.map((slot) => slot.id);

      if (allSelected) {
        // 取消選擇整天
        onSelectionCommit([], daySlotIds);
      } else {
        // 選擇整天（只新增尚未選擇的）
        const toAdd = daySlotIds.filter((id) => !selectedSlots.has(id));
        onSelectionCommit(toAdd, []);
      }
    },
    [slotsByDate, selectedSlots, onSelectionCommit],
  );

  // Vote mode change handler
  const setVoteMode = useCallback((newMode: VoteMode) => {
    setVoteModeState(newMode);
  }, []);

  // Clear selection — 全量替換為空
  const clearSelection = useCallback(() => {
    onReplaceAll([]);
  }, [onReplaceAll]);

  // Select all — 全量替換為全部
  const selectAll = useCallback(() => {
    const allSlotIds = slots.map((s) => s.id);
    onReplaceAll(allSlotIds);
  }, [slots, onReplaceAll]);

  // Apply conflicts from calendar — 增量更新
  const applyConflicts = useCallback(
    (conflictingSlotIds: string[]) => {
      if (voteMode === VoteMode.UNAVAILABLE) {
        // 不可用模式：將衝突時段標記為選取（不可用）
        // 在資料庫中，這代表移除投票（因為投票 = 有空）
        const toRemove = conflictingSlotIds.filter((id) =>
          selectedSlots.has(id),
        );
        onSelectionCommit([], toRemove);
      } else {
        // 可用模式：將衝突時段從選取中移除
        const toRemove = conflictingSlotIds.filter((id) =>
          selectedSlots.has(id),
        );
        onSelectionCommit([], toRemove);
      }
    },
    [voteMode, selectedSlots, onSelectionCommit],
  );

  return {
    // State
    selectedSlots,
    voteMode,

    // Actions
    setVoteMode,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  };
}
