"use client";

import { useMemo } from "react";
import { SlotMatrixRowViewModel } from "../../types";
import {
  buildSlotMatrixRows,
  type BuildSlotMatrixRowsInput,
} from "./slotMatrixCellModel";

/**
 * Memoises the slot matrix view model. All of the logic lives in
 * buildSlotMatrixRows so it can be tested without rendering.
 */
export function useSlotMatrixViewModel({
  mergedTimeRows,
  paginatedDates,
  slotsByDate,
  displaySelection,
  committedDisplaySelection,
  hasStagedVoteDraft,
  dragRect,
  getCellData,
  getCalendarProjectionForCell,
}: BuildSlotMatrixRowsInput): SlotMatrixRowViewModel[] {
  return useMemo(
    () =>
      buildSlotMatrixRows({
        mergedTimeRows,
        paginatedDates,
        slotsByDate,
        displaySelection,
        committedDisplaySelection,
        hasStagedVoteDraft,
        dragRect,
        getCellData,
        getCalendarProjectionForCell,
      }),
    [
      mergedTimeRows,
      paginatedDates,
      slotsByDate,
      displaySelection,
      committedDisplaySelection,
      hasStagedVoteDraft,
      dragRect,
      getCellData,
      getCalendarProjectionForCell,
    ],
  );
}
