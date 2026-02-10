"use client";

import { useMemo } from "react";
import {
  CalendarEvent,
  MergedTimeRow,
  TimeSlot,
  SlotMatrixCellViewModel,
  SlotMatrixRowViewModel,
} from "../types";

interface CellPosition {
  rowIndex: number;
  dateIndex: number;
}

interface UseSlotMatrixViewModelProps {
  mergedTimeRows: MergedTimeRow[];
  paginatedDates: string[];
  slotsByDate: Record<string, TimeSlot[]>;
  displaySelection: Set<string>;
  hoveredCell: CellPosition | null;
  longPressCell: CellPosition | null;
  isInDragRectangle: (rowIndex: number, dateIndex: number) => boolean;
  getVotersForMergedRow: (slotIndices: number[], dateKey: string) => string[];
  getCalendarProjectionForCell: (
    rowIndex: number,
    dateKey: string,
  ) => {
    events: CalendarEvent[];
    eventSpanById: Map<string, number>;
  };
}

/**
 * 組裝 Slot Matrix 渲染所需的 view model：
 * 把 selection/hover/drag、投票者與日曆 overlay 合併成逐列逐格資料。
 */
export function useSlotMatrixViewModel({
  mergedTimeRows,
  paginatedDates,
  slotsByDate,
  displaySelection,
  hoveredCell,
  longPressCell,
  isInDragRectangle,
  getVotersForMergedRow,
  getCalendarProjectionForCell,
}: UseSlotMatrixViewModelProps): SlotMatrixRowViewModel[] {
  return useMemo(() => {
    const rows: SlotMatrixRowViewModel[] = [];

    for (let rowIndex = 0; rowIndex < mergedTimeRows.length; rowIndex++) {
      const row = mergedTimeRows[rowIndex];
      const cells: SlotMatrixCellViewModel[] = [];

      for (let dateIndex = 0; dateIndex < paginatedDates.length; dateIndex++) {
        const dateKey = paginatedDates[dateIndex];
        const firstSlotIdx = row.slotIndices[0];
        const firstSlot = slotsByDate[dateKey]?.[firstSlotIdx];
        if (!firstSlot) continue;

        const mergedSlotIds = row.slotIndices
          .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
          .filter((id): id is string => Boolean(id));

        const selectedCount = row.slotIndices.filter((idx) => {
          const slot = slotsByDate[dateKey]?.[idx];
          return Boolean(slot && displaySelection.has(slot.id));
        }).length;

        const isSelected =
          mergedSlotIds.length > 0 && selectedCount === row.slotIndices.length;
        const isPartiallySelected =
          selectedCount > 0 && selectedCount < row.slotIndices.length;

        const calendarProjection = getCalendarProjectionForCell(
          rowIndex,
          dateKey,
        );

        cells.push({
          key: `${dateKey}-${rowIndex}`,
          slot: firstSlot,
          rowIndex,
          dateIndex,
          mergedSlotIds,
          isSelected,
          isPartiallySelected,
          isHovered:
            hoveredCell?.rowIndex === rowIndex &&
            hoveredCell?.dateIndex === dateIndex,
          isLongPressed:
            longPressCell?.rowIndex === rowIndex &&
            longPressCell?.dateIndex === dateIndex,
          inRectangle: isInDragRectangle(rowIndex, dateIndex),
          voters: getVotersForMergedRow(row.slotIndices, dateKey),
          slotCalendarEvents: calendarProjection.events,
          eventSpanById: calendarProjection.eventSpanById,
        });
      }

      rows.push({ rowIndex, cells });
    }

    return rows;
  }, [
    mergedTimeRows,
    paginatedDates,
    slotsByDate,
    displaySelection,
    hoveredCell,
    longPressCell,
    isInDragRectangle,
    getVotersForMergedRow,
    getCalendarProjectionForCell,
  ]);
}
