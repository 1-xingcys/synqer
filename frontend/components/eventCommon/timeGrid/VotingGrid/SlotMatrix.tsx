"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { TimeSlotCell } from "./TimeSlotCell";
import { SlotMatrixRowViewModel } from "../types";
import { VoteMode } from "@/types/event";

interface SlotMatrixProps {
  rows: SlotMatrixRowViewModel[];
  voteMode: VoteMode;
  isDragging: boolean;
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

/**
 * Renders the merged slot grid.
 *
 * Two rules keep TimeSlotCell's memo working, and both are easy to undo by
 * accident:
 *
 * 1. Handlers are passed straight through rather than bound per cell — the cell
 *    binds its own indices internally, so no new closure reaches it here.
 * 2. Only handlers with a stable identity may go to a cell at all. touchmove and
 *    touchend live on this container instead: they are rebuilt on every drag
 *    step, and touch events fire on the element the touch started in and bubble
 *    here anyway.
 */
export const SlotMatrix = memo(function SlotMatrix({
  rows,
  voteMode,
  isDragging,
  slotHeight,
  showCalendarOnGrid,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
}: SlotMatrixProps) {
  const tJoined = useTranslations("joined");
  // Read once here instead of in every cell.
  const allDayLabel = tJoined("googleCalendar.allDay");

  return (
    <div
      className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
      style={
        {
          "--slot-height": slotHeight,
          touchAction: "none",
        } as React.CSSProperties
      }
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {rows.map((row) => (
        <div key={row.rowIndex} className="flex">
          {row.cells.map((cell) => (
            <TimeSlotCell
              key={cell.key}
              slot={cell.slot}
              rowIndex={cell.rowIndex}
              dateIndex={cell.dateIndex}
              isSelected={cell.isSelected}
              isPartiallySelected={cell.isPartiallySelected}
              selectionTone={cell.selectionTone}
              isDragging={isDragging}
              inRectangle={cell.inRectangle}
              rectEdgeTop={cell.rectEdgeTop}
              rectEdgeBottom={cell.rectEdgeBottom}
              rectEdgeLeft={cell.rectEdgeLeft}
              rectEdgeRight={cell.rectEdgeRight}
              voteMode={voteMode}
              voters={cell.voters}
              slotCalendarEvents={cell.slotCalendarEvents}
              eventSpanById={cell.eventSpanById}
              showCalendarOnGrid={showCalendarOnGrid}
              mergedSlotIdsAttr={cell.mergedSlotIdsAttr}
              allDayLabel={allDayLabel}
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
              onTouchStart={onTouchStart}
              onClick={onClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
