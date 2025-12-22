"use client";

import { useCallback } from "react";
import { TimeSlot, VoteMode, GridPosition } from "../types";
import { useSlotGrid } from "./useSlotGrid";
import { useSlotSelection } from "./useSlotSelection";
import { useDragSelection } from "./useDragSelection";

interface UseVotingSelectionProps {
  slots: TimeSlot[];
  initialSelectedIds: string[];
}

interface UseVotingSelectionReturn {
  // State
  selectedSlots: Set<string>;
  isDragging: boolean;
  dragStart: GridPosition | null;
  dragEnd: GridPosition | null;
  baseSelection: Set<string>;
  hoveredSlot: string | null;
  longPressSlot: string | null;
  voteMode: VoteMode;

  // Computed
  previewSelection: Set<string>;
  displaySelection: Set<string>;
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  timeSlots: TimeSlot[];
  slotGrid: string[][];

  // Actions
  setSelectedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  setHoveredSlot: React.Dispatch<React.SetStateAction<string | null>>;
  setVoteMode: (mode: VoteMode) => void;
  handleMouseDown: (slotId: string, e: React.MouseEvent) => void;
  handleMouseEnter: (slotId: string) => void;
  handleMouseUp: () => void;
  handleTouchStart: (slotId: string, e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleClick: (slotId: string) => void;
  selectEntireDay: (dateKey: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isSlotInRectangle: (slotId: string) => boolean;
  getRectangleBounds: () => {
    minDate: number;
    maxDate: number;
    minTime: number;
    maxTime: number;
  } | null;
  isDayFullySelected: (dateKey: string) => boolean;
  getSlotPosition: (slotId: string) => GridPosition | null;
  applyConflicts: (conflictingSlotIds: string[]) => void;
}

export function useVotingSelection({
  slots,
  initialSelectedIds,
}: UseVotingSelectionProps): UseVotingSelectionReturn {
  // Grid data processing
  const {
    slotsByDate,
    dates,
    timeSlots,
    slotGrid,
    getSlotPosition,
    getSlotsInRectangle,
  } = useSlotGrid({ slots });

  // Selection state management
  const {
    selectedSlots,
    voteMode,
    setSelectedSlots,
    setVoteMode: setVoteModeInternal,
    selectEntireDay,
    clearSelection: clearSelectionInternal,
    selectAll: selectAllInternal,
    applyConflicts,
    isDayFullySelected: isDayFullySelectedInternal,
  } = useSlotSelection({ slots, slotsByDate, initialSelectedIds });

  // Drag selection logic
  const {
    isDragging,
    dragStart,
    dragEnd,
    baseSelection,
    hoveredSlot,
    longPressSlot,
    previewSelection,
    displaySelection,
    setHoveredSlot,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    isSlotInRectangle,
    getRectangleBounds,
    resetBaseSelection,
  } = useDragSelection({
    selectedSlots,
    setSelectedSlots,
    getSlotPosition,
    getSlotsInRectangle,
  });

  // Wrap setVoteMode to also reset base selection
  const setVoteMode = useCallback(
    (mode: VoteMode) => {
      setVoteModeInternal(mode, resetBaseSelection);
    },
    [setVoteModeInternal, resetBaseSelection],
  );

  // Wrap clearSelection to also reset base selection
  const clearSelection = useCallback(() => {
    clearSelectionInternal();
    resetBaseSelection();
  }, [clearSelectionInternal, resetBaseSelection]);

  // Wrap selectAll to also update base selection
  const selectAll = useCallback(() => {
    selectAllInternal();
  }, [selectAllInternal]);

  // Wrap isDayFullySelected to use display selection when dragging
  const isDayFullySelected = useCallback(
    (dateKey: string) => {
      const checkSet = isDragging ? previewSelection : selectedSlots;
      return isDayFullySelectedInternal(dateKey, checkSet);
    },
    [isDragging, previewSelection, selectedSlots, isDayFullySelectedInternal],
  );

  return {
    // State
    selectedSlots,
    isDragging,
    dragStart,
    dragEnd,
    baseSelection,
    hoveredSlot,
    longPressSlot,
    voteMode,

    // Computed
    previewSelection,
    displaySelection,
    slotsByDate,
    dates,
    timeSlots,
    slotGrid,

    // Actions
    setSelectedSlots,
    setHoveredSlot,
    setVoteMode,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    selectEntireDay,
    clearSelection,
    selectAll,
    isSlotInRectangle,
    getRectangleBounds,
    isDayFullySelected,
    getSlotPosition,
    applyConflicts,
  };
}
