import { VoteMode } from "@/types/event";

interface SelectionDiff {
  addSlotIds: string[];
  removeSlotIds: string[];
}

/**
 * Project canonical available-slot selection into UI selection for current mode.
 * - available mode: selected = available slots
 * - unavailable mode: selected = unavailable slots (complement of available)
 */
export function projectSelectionForMode(
  availableSlotIds: Set<string>,
  allSlotIds: string[],
  voteMode: VoteMode,
): Set<string> {
  if (voteMode === VoteMode.AVAILABLE) {
    return new Set(availableSlotIds);
  }

  const unavailable = new Set<string>();
  for (const slotId of allSlotIds) {
    if (!availableSlotIds.has(slotId)) {
      unavailable.add(slotId);
    }
  }
  return unavailable;
}

/**
 * Convert a UI-level selection diff into canonical available-slot diff.
 */
export function mapDisplayDiffToAvailableDiff(
  voteMode: VoteMode,
  addDisplaySlotIds: string[],
  removeDisplaySlotIds: string[],
): SelectionDiff {
  if (voteMode === VoteMode.AVAILABLE) {
    return {
      addSlotIds: addDisplaySlotIds,
      removeSlotIds: removeDisplaySlotIds,
    };
  }

  return {
    addSlotIds: removeDisplaySlotIds,
    removeSlotIds: addDisplaySlotIds,
  };
}

/**
 * Canonical selection used when user clicks "clear selection" in current mode.
 */
export function getClearSelectionAvailableSlotIds(
  voteMode: VoteMode,
  allSlotIds: string[],
): string[] {
  if (voteMode === VoteMode.AVAILABLE) {
    return [];
  }

  // In unavailable mode, clearing UI selection means "no slots are unavailable".
  return allSlotIds;
}

/**
 * Canonical selection used when user clicks "select all" in current mode.
 */
export function getSelectAllAvailableSlotIds(
  voteMode: VoteMode,
  allSlotIds: string[],
): string[] {
  if (voteMode === VoteMode.AVAILABLE) {
    return allSlotIds;
  }

  // In unavailable mode, selecting all UI cells means "all slots are unavailable".
  return [];
}

/**
 * Mark given slots as unavailable in canonical representation.
 * Canonical model stores only available slots, so this is always remove-only.
 */
export function getMarkUnavailableDiff(
  availableSlotIds: Set<string>,
  slotIdsToMarkUnavailable: string[],
): SelectionDiff {
  const removeSlotIds = slotIdsToMarkUnavailable.filter((id) =>
    availableSlotIds.has(id),
  );

  return {
    addSlotIds: [],
    removeSlotIds,
  };
}
