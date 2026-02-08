"use client";

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
  displaySelection: Set<string>;
  voteMode: VoteMode;

  // Computed
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  timeSlots: TimeSlot[];

  // Actions
  setVoteMode: (mode: VoteMode) => void;
  commitDisplaySelectionChange: (
    addDisplaySlotIds: string[],
    removeDisplaySlotIds: string[],
  ) => void;
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
    displaySelection,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  } = useSlotSelection({
    slots,
    slotsByDate,
    selectedSlots,
    onSelectionCommit,
    onReplaceAll,
  });

  return {
    // State
    selectedSlots,
    displaySelection,
    voteMode,

    // Computed
    slotsByDate,
    dates,
    timeSlots,

    // Actions
    setVoteMode,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    isDayFullySelected,
    applyConflicts,
  };
}
