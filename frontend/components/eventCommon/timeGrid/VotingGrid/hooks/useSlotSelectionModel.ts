"use client";

import { useState, useCallback, useMemo } from "react";
import { TimeSlot } from "../../types";
import { VoteMode } from "@/types/event";
import {
  projectSelectionForMode,
  mapDisplayDiffToAvailableDiff,
  getClearSelectionAvailableSlotIds,
  getSelectAllAvailableSlotIds,
  getMarkUnavailableDiff,
} from "../domain/selection";

interface UseSlotSelectionModelProps {
  slots: TimeSlot[];
  slotsByDate: Record<string, TimeSlot[]>;
  committedSlots: Set<string>;
  stagedSlots: Set<string>;
  hasStagedVoteDraft: boolean;
  hasVoted: boolean;
  /** The host's default mode, used until the visitor picks one themselves. */
  initialVoteMode: VoteMode;
  onSelectionCommit: (
    addSlotIds: string[],
    removeSlotIds: string[],
    voteMode: VoteMode,
  ) => void;
}

interface UseSlotSelectionModelReturn {
  displaySelection: Set<string>;
  committedDisplaySelection: Set<string>;
  voteMode: VoteMode;
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

function diffSets(currentSet: Set<string>, targetSet: Set<string>) {
  const addSlotIds: string[] = [];
  const removeSlotIds: string[] = [];

  targetSet.forEach((slotId) => {
    if (!currentSet.has(slotId)) addSlotIds.push(slotId);
  });

  currentSet.forEach((slotId) => {
    if (!targetSet.has(slotId)) removeSlotIds.push(slotId);
  });

  return { addSlotIds, removeSlotIds };
}

/**
 * Selection rules for staged/committed votes:
 * - has staged draft: use the staged canonical available slots
 * - no staged + hasVoted: use the committed available slots
 * - no staged + !hasVoted:
 *   - available mode defaults to nothing available (available=[])
 *   - unavailable mode defaults to everything available (available=all)
 */
export function useSlotSelectionModel({
  slots,
  slotsByDate,
  committedSlots,
  stagedSlots,
  hasStagedVoteDraft,
  hasVoted,
  initialVoteMode,
  onSelectionCommit,
}: UseSlotSelectionModelProps): UseSlotSelectionModelReturn {
  const [voteMode, setVoteModeState] = useState<VoteMode>(initialVoteMode);
  const allSlotIds = useMemo(() => slots.map((slot) => slot.id), [slots]);

  const effectiveAvailableSlots = useMemo(() => {
    if (hasStagedVoteDraft) {
      return new Set(stagedSlots);
    }

    if (hasVoted) {
      return new Set(committedSlots);
    }

    if (voteMode === VoteMode.UNAVAILABLE) {
      return new Set(allSlotIds);
    }

    return new Set<string>();
  }, [
    hasStagedVoteDraft,
    stagedSlots,
    hasVoted,
    committedSlots,
    voteMode,
    allSlotIds,
  ]);

  const displaySelection = useMemo(
    () =>
      projectSelectionForMode(effectiveAvailableSlots, allSlotIds, voteMode),
    [effectiveAvailableSlots, allSlotIds, voteMode],
  );

  const committedDisplaySelection = useMemo(() => {
    if (!hasVoted) return new Set<string>();
    return projectSelectionForMode(committedSlots, allSlotIds, voteMode);
  }, [hasVoted, committedSlots, allSlotIds, voteMode]);

  const commitDisplaySelectionChange = useCallback(
    (addDisplaySlotIds: string[], removeDisplaySlotIds: string[]) => {
      const { addSlotIds, removeSlotIds } = mapDisplayDiffToAvailableDiff(
        voteMode,
        addDisplaySlotIds,
        removeDisplaySlotIds,
      );
      onSelectionCommit(addSlotIds, removeSlotIds, voteMode);
    },
    [voteMode, onSelectionCommit],
  );

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

  const selectEntireDay = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      const daySlotIds = daySlots.map((slot) => slot.id);
      const allSelected = daySlots.every((slot) =>
        displaySelection.has(slot.id),
      );

      if (allSelected) {
        commitDisplaySelectionChange([], daySlotIds);
      } else {
        const toAdd = daySlotIds.filter(
          (slotId) => !displaySelection.has(slotId),
        );
        commitDisplaySelectionChange(toAdd, []);
      }
    },
    [slotsByDate, displaySelection, commitDisplaySelectionChange],
  );

  const setVoteMode = useCallback((newMode: VoteMode) => {
    setVoteModeState(newMode);
  }, []);

  const clearSelection = useCallback(() => {
    const targetAvailable = new Set(
      getClearSelectionAvailableSlotIds(voteMode, allSlotIds),
    );
    const { addSlotIds, removeSlotIds } = diffSets(
      effectiveAvailableSlots,
      targetAvailable,
    );
    onSelectionCommit(addSlotIds, removeSlotIds, voteMode);
  }, [voteMode, allSlotIds, effectiveAvailableSlots, onSelectionCommit]);

  const selectAll = useCallback(() => {
    const targetAvailable = new Set(
      getSelectAllAvailableSlotIds(voteMode, allSlotIds),
    );
    const { addSlotIds, removeSlotIds } = diffSets(
      effectiveAvailableSlots,
      targetAvailable,
    );
    onSelectionCommit(addSlotIds, removeSlotIds, voteMode);
  }, [voteMode, allSlotIds, effectiveAvailableSlots, onSelectionCommit]);

  const applyConflicts = useCallback(
    (conflictingSlotIds: string[]) => {
      const { addSlotIds, removeSlotIds } = getMarkUnavailableDiff(
        effectiveAvailableSlots,
        conflictingSlotIds,
      );
      onSelectionCommit(addSlotIds, removeSlotIds, voteMode);
    },
    [effectiveAvailableSlots, onSelectionCommit, voteMode],
  );

  return {
    displaySelection,
    committedDisplaySelection,
    voteMode,
    setVoteMode,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  };
}
