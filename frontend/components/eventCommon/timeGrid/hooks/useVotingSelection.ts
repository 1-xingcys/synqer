"use client";

import { useCallback } from "react";
import { TimeSlot } from "../types";
import { VoteMode } from "@/types/event";
import { useSlotGrid } from "./useSlotGrid";
import { useSlotSelection } from "./useSlotSelection";

interface UseVotingSelectionProps {
  slots: TimeSlot[];
  /** 從 React Query cache 派生的當前使用者已選 slot IDs */
  selectedSlots: Set<string>;
  /** 增量更新 callback */
  onSelectionCommit: (addSlotIds: string[], removeSlotIds: string[]) => void;
  /** 全量替換 callback */
  onReplaceAll: (slotIds: string[]) => void;
}

interface UseVotingSelectionReturn {
  // State
  selectedSlots: Set<string>;
  voteMode: VoteMode;

  // Computed
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  timeSlots: TimeSlot[];

  // Actions
  setVoteMode: (mode: VoteMode) => void;
  selectEntireDay: (dateKey: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isDayFullySelected: (dateKey: string) => boolean;
  applyConflicts: (conflictingSlotIds: string[]) => void;
}

export function useVotingSelection({
  slots,
  selectedSlots,
  onSelectionCommit,
  onReplaceAll,
}: UseVotingSelectionProps): UseVotingSelectionReturn {
  // Grid data processing
  const { slotsByDate, dates, timeSlots } = useSlotGrid({ slots });

  // Selection state management (voteMode + actions)
  const {
    voteMode,
    setVoteMode,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected: isDayFullySelectedInternal,
  } = useSlotSelection({
    slots,
    slotsByDate,
    selectedSlots,
    onSelectionCommit,
    onReplaceAll,
  });

  // Wrap isDayFullySelected to use current selectedSlots
  const isDayFullySelected = useCallback(
    (dateKey: string) => {
      return isDayFullySelectedInternal(dateKey, selectedSlots);
    },
    [selectedSlots, isDayFullySelectedInternal],
  );

  return {
    // State
    selectedSlots,
    voteMode,

    // Computed
    slotsByDate,
    dates,
    timeSlots,

    // Actions
    setVoteMode,
    selectEntireDay,
    clearSelection,
    selectAll,
    isDayFullySelected,
    applyConflicts,
  };
}
