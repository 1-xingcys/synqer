"use client";

import { useState, useCallback, useMemo } from "react";
import { TimeSlot } from "../types";
import { VoteMode } from "@/types/event";
import {
  projectSelectionForMode,
  mapDisplayDiffToAvailableDiff,
  getClearSelectionAvailableSlotIds,
  getSelectAllAvailableSlotIds,
  getMarkUnavailableDiff,
} from "../domain/selection";

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
  displaySelection: Set<string>;
  voteMode: VoteMode;

  // Actions
  setVoteMode: (mode: VoteMode) => void;
  commitDisplaySelectionChange: (
    addDisplaySlotIds: string[],
    removeDisplaySlotIds: string[],
  ) => void;
  selectEntireDay: (dateKey: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  applyConflicts: (conflictingSlotIds: string[]) => void;
  isDayFullySelected: (dateKey: string) => boolean;
}

export function useSlotSelection({
  slots,
  slotsByDate,
  selectedSlots,
  onSelectionCommit,
  onReplaceAll,
}: UseSlotSelectionProps): UseSlotSelectionReturn {
  const [voteMode, setVoteModeState] = useState<VoteMode>(VoteMode.AVAILABLE);
  const allSlotIds = useMemo(() => slots.map((s) => s.id), [slots]);

  // UI-level selection projected by current vote mode.
  const displaySelection = useMemo(
    () => projectSelectionForMode(selectedSlots, allSlotIds, voteMode),
    [selectedSlots, allSlotIds, voteMode],
  );

  const commitDisplaySelectionChange = useCallback(
    (addDisplaySlotIds: string[], removeDisplaySlotIds: string[]) => {
      const { addSlotIds, removeSlotIds } = mapDisplayDiffToAvailableDiff(
        voteMode,
        addDisplaySlotIds,
        removeDisplaySlotIds,
      );

      onSelectionCommit(addSlotIds, removeSlotIds);
    },
    [voteMode, onSelectionCommit],
  );

  // Check if a day is fully selected
  const isDayFullySelected = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      return (
        daySlots.length > 0 &&
        daySlots.every((slot) => displaySelection.has(slot.id))
      );
    },
    [slotsByDate, displaySelection],
  );

  // Select entire day in current display mode — 增量更新
  const selectEntireDay = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      const allSelected = daySlots.every((slot) =>
        displaySelection.has(slot.id),
      );
      const daySlotIds = daySlots.map((slot) => slot.id);

      if (allSelected) {
        // Toggle day off in display selection.
        commitDisplaySelectionChange([], daySlotIds);
      } else {
        // Toggle day on in display selection.
        const toAdd = daySlotIds.filter((id) => !displaySelection.has(id));
        commitDisplaySelectionChange(toAdd, []);
      }
    },
    [slotsByDate, displaySelection, commitDisplaySelectionChange],
  );

  // Vote mode change handler
  const setVoteMode = useCallback((newMode: VoteMode) => {
    setVoteModeState(newMode);
  }, []);

  // Clear selection in current display mode.
  const clearSelection = useCallback(() => {
    onReplaceAll(getClearSelectionAvailableSlotIds(voteMode, allSlotIds));
  }, [onReplaceAll, voteMode, allSlotIds]);

  // Select all in current display mode.
  const selectAll = useCallback(() => {
    onReplaceAll(getSelectAllAvailableSlotIds(voteMode, allSlotIds));
  }, [onReplaceAll, voteMode, allSlotIds]);

  // Apply conflicts from calendar (mark as unavailable in canonical model).
  const applyConflicts = useCallback(
    (conflictingSlotIds: string[]) => {
      const { addSlotIds, removeSlotIds } = getMarkUnavailableDiff(
        selectedSlots,
        conflictingSlotIds,
      );
      onSelectionCommit(addSlotIds, removeSlotIds);
    },
    [selectedSlots, onSelectionCommit],
  );

  return {
    // State
    selectedSlots,
    displaySelection,
    voteMode,

    // Actions
    setVoteMode,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  };
}
