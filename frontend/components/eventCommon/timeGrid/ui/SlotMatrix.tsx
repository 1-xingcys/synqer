"use client";

import { memo } from "react";
import { TimeSlotCell } from "./TimeSlotCell";
import { SlotMatrixRowViewModel } from "../types";
import { VoteMode } from "@/types/event";

interface MergedRectBounds {
  minRow: number;
  maxRow: number;
  minDate: number;
  maxDate: number;
}

interface SlotMatrixProps {
  rows: SlotMatrixRowViewModel[];
  voteMode: VoteMode;
  isDragging: boolean;
  mergedRectBounds: MergedRectBounds | null;
  slotHeight: string;
  showCalendarOnGrid: boolean;
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
  rows,
  voteMode,
  isDragging,
  mergedRectBounds,
  slotHeight,
  showCalendarOnGrid,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
}: SlotMatrixProps) {
  return (
    <div
      className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
      style={{ "--slot-height": slotHeight } as React.CSSProperties}
    >
      {rows.map((row) => (
        <div key={row.rowIndex} className="flex">
          {row.cells.map((cell) => {
            return (
              <TimeSlotCell
                key={cell.key}
                slot={cell.slot}
                rowIndex={cell.rowIndex}
                dateIndex={cell.dateIndex}
                isSelected={cell.isSelected}
                isPartiallySelected={cell.isPartiallySelected}
                isHovered={cell.isHovered}
                isLongPressed={cell.isLongPressed}
                isDragging={isDragging}
                inRectangle={cell.inRectangle}
                mergedRectBounds={mergedRectBounds}
                voteMode={voteMode}
                voters={cell.voters}
                slotCalendarEvents={cell.slotCalendarEvents}
                eventSpanById={cell.eventSpanById}
                showCalendarOnGrid={showCalendarOnGrid}
                mergedSlotIds={cell.mergedSlotIds}
                onMouseDown={(e) =>
                  onMouseDown(cell.rowIndex, cell.dateIndex, e)
                }
                onMouseEnter={() => onMouseEnter(cell.rowIndex, cell.dateIndex)}
                onTouchStart={(e) =>
                  onTouchStart(cell.rowIndex, cell.dateIndex, e)
                }
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => onClick(cell.rowIndex, cell.dateIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});
