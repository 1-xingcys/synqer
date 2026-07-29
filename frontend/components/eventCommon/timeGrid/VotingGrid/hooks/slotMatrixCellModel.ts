import {
  CalendarEvent,
  MergedTimeRow,
  SlotMatrixCellViewModel,
  SlotMatrixRowViewModel,
  TimeSlot,
} from "../../types";
import type { SlotCellData } from "./useSlotCellDataProjection";

export interface SlotMatrixDragRect {
  minRow: number;
  maxRow: number;
  minDate: number;
  maxDate: number;
}

interface CalendarCellProjection {
  events: CalendarEvent[];
  eventSpanById: Map<string, number>;
}

export interface BuildSlotMatrixRowsInput {
  mergedTimeRows: MergedTimeRow[];
  paginatedDates: string[];
  slotsByDate: Record<string, TimeSlot[]>;
  displaySelection: Set<string>;
  committedDisplaySelection: Set<string>;
  hasStagedVoteDraft: boolean;
  /** Null unless a drag is in progress; carries the rectangle while one is. */
  dragRect: SlotMatrixDragRect | null;
  getCellData: (rowIndex: number, dateKey: string) => SlotCellData;
  getCalendarProjectionForCell: (
    rowIndex: number,
    dateKey: string,
  ) => CalendarCellProjection;
}

/**
 * Builds the per-cell render inputs for the slot matrix.
 *
 * The point of this function being pure and cell-local: a drag step changes
 * `dragRect` and `displaySelection`, and only the cells whose own fields differ
 * come out different. Cells outside the rectangle keep every field — including
 * the `voters` and calendar references, which come from projections keyed on
 * data alone — so `memo` on TimeSlotCell skips them.
 */
export function buildSlotMatrixRows({
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
  const rows: SlotMatrixRowViewModel[] = [];

  for (let rowIndex = 0; rowIndex < mergedTimeRows.length; rowIndex++) {
    const row = mergedTimeRows[rowIndex];
    const cells: SlotMatrixCellViewModel[] = [];

    for (let dateIndex = 0; dateIndex < paginatedDates.length; dateIndex++) {
      const dateKey = paginatedDates[dateIndex];
      const firstSlot = slotsByDate[dateKey]?.[row.slotIndices[0]];
      if (!firstSlot) continue;

      const { slotIds, mergedSlotIdsAttr, voters } = getCellData(
        rowIndex,
        dateKey,
      );

      let selectedCount = 0;
      let differsFromCommitted = false;
      for (const slotId of slotIds) {
        const isSlotSelected = displaySelection.has(slotId);
        if (isSlotSelected) selectedCount++;
        if (isSlotSelected !== committedDisplaySelection.has(slotId)) {
          differsFromCommitted = true;
        }
      }

      const isSelected =
        slotIds.length > 0 && selectedCount === row.slotIndices.length;
      const isPartiallySelected =
        selectedCount > 0 && selectedCount < row.slotIndices.length;

      const selectionTone: SlotMatrixCellViewModel["selectionTone"] = isSelected
        ? hasStagedVoteDraft && differsFromCommitted
          ? "staged"
          : "committed"
        : "none";

      let inRectangle = false;
      let rectEdgeTop = false;
      let rectEdgeBottom = false;
      let rectEdgeLeft = false;
      let rectEdgeRight = false;

      if (
        dragRect !== null &&
        rowIndex >= dragRect.minRow &&
        rowIndex <= dragRect.maxRow &&
        dateIndex >= dragRect.minDate &&
        dateIndex <= dragRect.maxDate
      ) {
        inRectangle = true;
        rectEdgeTop = rowIndex === dragRect.minRow;
        rectEdgeBottom = rowIndex === dragRect.maxRow;
        rectEdgeLeft = dateIndex === dragRect.minDate;
        rectEdgeRight = dateIndex === dragRect.maxDate;
      }

      const calendarProjection = getCalendarProjectionForCell(
        rowIndex,
        dateKey,
      );

      cells.push({
        key: `${dateKey}-${rowIndex}`,
        slot: firstSlot,
        rowIndex,
        dateIndex,
        mergedSlotIdsAttr,
        isSelected,
        isPartiallySelected,
        selectionTone,
        inRectangle,
        rectEdgeTop,
        rectEdgeBottom,
        rectEdgeLeft,
        rectEdgeRight,
        voters,
        slotCalendarEvents: calendarProjection.events,
        eventSpanById: calendarProjection.eventSpanById,
      });
    }

    rows.push({ rowIndex, cells });
  }

  return rows;
}
