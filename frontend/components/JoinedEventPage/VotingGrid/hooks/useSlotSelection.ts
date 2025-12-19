"use client";

import { useState, useCallback } from "react";
import { TimeSlot, VoteMode } from "../types";

interface UseSlotSelectionProps {
  slots: TimeSlot[];
  slotsByDate: Record<string, TimeSlot[]>;
  initialSelectedIds: string[];
}

interface UseSlotSelectionReturn {
  // State
  selectedSlots: Set<string>;
  voteMode: VoteMode;

  // Actions
  setSelectedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  setVoteMode: (mode: VoteMode, onModeChange?: () => void) => void;
  selectEntireDay: (dateKey: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  applyConflicts: (conflictingSlotIds: string[]) => void;
  isDayFullySelected: (dateKey: string, checkSet?: Set<string>) => boolean;
}

export function useSlotSelection({
  slots,
  slotsByDate,
  initialSelectedIds,
}: UseSlotSelectionProps): UseSlotSelectionReturn {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [voteMode, setVoteModeState] = useState<VoteMode>("available");

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

  // Select entire day
  const selectEntireDay = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      const allSelected = daySlots.every((slot) => selectedSlots.has(slot.id));

      setSelectedSlots((prev) => {
        const newSelected = new Set(prev);
        daySlots.forEach((slot) => {
          if (allSelected) {
            newSelected.delete(slot.id);
          } else {
            newSelected.add(slot.id);
          }
        });
        return newSelected;
      });
    },
    [slotsByDate, selectedSlots],
  );

  // Vote mode change handler
  const setVoteMode = useCallback(
    (newMode: VoteMode, onModeChange?: () => void) => {
      setVoteModeState((prevMode) => {
        if (newMode !== prevMode) {
          setSelectedSlots(new Set());
          onModeChange?.();
        }
        return newMode;
      });
    },
    [],
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSlots(new Set());
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    const allSlots = new Set(slots.map((s) => s.id));
    setSelectedSlots(allSlots);
  }, [slots]);

  // Apply conflicts from calendar
  const applyConflicts = useCallback(
    (conflictingSlotIds: string[]) => {
      if (voteMode === "unavailable") {
        setSelectedSlots((prev) => {
          const newSelection = new Set(prev);
          conflictingSlotIds.forEach((id) => newSelection.add(id));
          return newSelection;
        });
      } else {
        setSelectedSlots((prev) => {
          const newSelection = new Set(prev);
          conflictingSlotIds.forEach((id) => newSelection.delete(id));
          return newSelection;
        });
      }
    },
    [voteMode],
  );

  return {
    // State
    selectedSlots,
    voteMode,

    // Actions
    setSelectedSlots,
    setVoteMode,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  };
}
