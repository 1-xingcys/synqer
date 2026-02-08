"use client";

import { memo, useCallback } from "react";
import { TimeSlotCell } from "./TimeSlotCell";
import { MergedTimeRow, TimeSlot, CalendarEvent } from "../types";
import { VoteMode } from "@/types/event";

interface MergedRectBounds {
  minRow: number;
  maxRow: number;
  minDate: number;
  maxDate: number;
}

interface HoveredCell {
  rowIndex: number;
  dateIndex: number;
}

interface SlotMatrixProps {
  mergedRows: MergedTimeRow[];
  paginatedDates: string[];
  slotsByDate: Record<string, TimeSlot[]>;
  displaySelection: Set<string>;
  voteMode: VoteMode;
  isDragging: boolean;
  hoveredCell: HoveredCell | null;
  longPressCell: HoveredCell | null;
  mergedRectBounds: MergedRectBounds | null;
  slotHeight: string;
  showCalendarOnGrid: boolean;
  getCalendarProjectionForCell: (
    rowIndex: number,
    dateKey: string,
  ) => {
    events: CalendarEvent[];
    eventSpanById: Map<string, number>;
  };
  // Callbacks
  isInDragRectangle: (rowIndex: number, dateIndex: number) => boolean;
  getVotersForMergedRow: (slotIndices: number[], dateKey: string) => string[];
  onMouseDown: (
    rowIndex: number,
    dateIndex: number,
    e: React.MouseEvent,
  ) => void;
  onMouseEnter: (rowIndex: number, dateIndex: number) => void;
  onTouchStart: (
    rowIndex: number,
    dateIndex: number,
    e: React.TouchEvent,
  ) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onClick: (rowIndex: number, dateIndex: number) => void;
}

export const SlotMatrix = memo(function SlotMatrix({
  mergedRows,
  paginatedDates,
  slotsByDate,
  displaySelection,
  voteMode,
  isDragging,
  hoveredCell,
  longPressCell,
  mergedRectBounds,
  slotHeight,
  showCalendarOnGrid,
  getCalendarProjectionForCell,
  isInDragRectangle,
  getVotersForMergedRow,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
}: SlotMatrixProps) {
  // Check if all slots in merged row are selected
  const isMergedRowSelected = useCallback(
    (slotIndices: number[], dateKey: string): boolean => {
      return slotIndices.every((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        return slot && displaySelection.has(slot.id);
      });
    },
    [slotsByDate, displaySelection],
  );

  // Check if any slot in merged row is selected (partial)
  const isMergedRowPartiallySelected = useCallback(
    (slotIndices: number[], dateKey: string): boolean => {
      const selectedCount = slotIndices.filter((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        return slot && displaySelection.has(slot.id);
      }).length;
      return selectedCount > 0 && selectedCount < slotIndices.length;
    },
    [slotsByDate, displaySelection],
  );

  return (
    <div
      className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
      style={{ "--slot-height": slotHeight } as React.CSSProperties}
    >
      {mergedRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {paginatedDates.map((dateKey, dateIndex) => {
            // Get all slot IDs for this merged row
            const slotIds = row.slotIndices
              .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
              .filter(Boolean);

            // Use first slot for basic props
            const firstSlotIdx = row.slotIndices[0];
            const firstSlot = slotsByDate[dateKey]?.[firstSlotIdx];

            if (!firstSlot) return null;

            const isSelected = isMergedRowSelected(row.slotIndices, dateKey);
            const isPartiallySelected = isMergedRowPartiallySelected(
              row.slotIndices,
              dateKey,
            );
            const voters = getVotersForMergedRow(row.slotIndices, dateKey);
            const isHovered =
              hoveredCell?.rowIndex === rowIndex &&
              hoveredCell?.dateIndex === dateIndex;
            const isLongPressed =
              longPressCell?.rowIndex === rowIndex &&
              longPressCell?.dateIndex === dateIndex;

            // Check if this merged cell is in the drag rectangle
            const inRectangle = isInDragRectangle(rowIndex, dateIndex);

            const calendarProjection = getCalendarProjectionForCell(
              rowIndex,
              dateKey,
            );

            return (
              <TimeSlotCell
                key={`${dateKey}-${rowIndex}`}
                slot={firstSlot}
                rowIndex={rowIndex}
                dateIndex={dateIndex}
                isSelected={isSelected}
                isPartiallySelected={isPartiallySelected}
                isHovered={isHovered}
                isLongPressed={isLongPressed}
                isDragging={isDragging}
                inRectangle={inRectangle}
                mergedRectBounds={mergedRectBounds}
                voteMode={voteMode}
                voters={voters}
                slotCalendarEvents={calendarProjection.events}
                eventSpanById={calendarProjection.eventSpanById}
                showCalendarOnGrid={showCalendarOnGrid}
                mergedSlotIds={slotIds}
                onMouseDown={(e) => onMouseDown(rowIndex, dateIndex, e)}
                onMouseEnter={() => onMouseEnter(rowIndex, dateIndex)}
                onTouchStart={(e) => onTouchStart(rowIndex, dateIndex, e)}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => onClick(rowIndex, dateIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});
