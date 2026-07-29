"use client";

import { memo } from "react";
import { TimeSlot, CalendarEvent } from "../types";
import { VoteMode } from "@/types/event";
import { formatEventTime } from "../utils";

interface TimeSlotCellProps {
  slot: TimeSlot;
  rowIndex: number;
  dateIndex: number;
  isSelected: boolean;
  isPartiallySelected?: boolean;
  selectionTone?: "none" | "committed" | "staged";
  isDragging: boolean;
  /** True only while a drag is in progress and this cell is inside the rectangle. */
  inRectangle: boolean;
  rectEdgeTop: boolean;
  rectEdgeBottom: boolean;
  rectEdgeLeft: boolean;
  rectEdgeRight: boolean;
  voteMode: VoteMode;
  voters: string[];
  slotCalendarEvents: CalendarEvent[];
  eventSpanById: Map<string, number>;
  showCalendarOnGrid: boolean;
  /** Comma-joined ids of every slot in this merged cell. */
  mergedSlotIdsAttr: string;
  allDayLabel: string;
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
  onClick: (rowIndex: number, dateIndex: number) => void;
}

/**
 * One merged cell of the voting grid.
 *
 * Memoised, and it only works because every prop above is a primitive or a
 * reference that survives a drag step. Adding a prop that is rebuilt each
 * render — an inline handler, a fresh array, a bounds object — silently turns
 * every drag back into a full-grid repaint.
 */
export const TimeSlotCell = memo(function TimeSlotCell({
  slot,
  rowIndex,
  dateIndex,
  isSelected,
  isPartiallySelected = false,
  selectionTone = "none",
  isDragging,
  inRectangle,
  rectEdgeTop,
  rectEdgeBottom,
  rectEdgeLeft,
  rectEdgeRight,
  voteMode,
  voters,
  slotCalendarEvents,
  eventSpanById,
  showCalendarOnGrid,
  mergedSlotIdsAttr,
  allDayLabel,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onClick,
}: TimeSlotCellProps) {
  // Determine border style for rectangle selection
  // Only show blue border on the outer edges of the selection rectangle
  let borderClasses = "border-r border-b border-gray-100 dark:border-zinc-800";
  if (inRectangle) {
    // Build border classes - only outer edges get blue border
    const borders = [];

    // Top border: blue if top edge, else transparent (no internal lines)
    borders.push(
      rectEdgeTop ? "border-t-2 border-t-blue-500 dark:border-t-blue-400" : "",
    );

    // Bottom border: blue if bottom edge, else normal grid line
    borders.push(
      rectEdgeBottom
        ? "border-b-2 border-b-blue-500 dark:border-b-blue-400"
        : "border-b border-b-gray-100 dark:border-b-zinc-800",
    );

    // Left border: blue if left edge, else transparent (no internal lines)
    borders.push(
      rectEdgeLeft ? "border-l-2 border-l-blue-500 dark:border-l-blue-400" : "",
    );

    // Right border: blue if right edge, else normal grid line
    borders.push(
      rectEdgeRight
        ? "border-r-2 border-r-blue-500 dark:border-r-blue-400"
        : "border-r border-r-gray-100 dark:border-r-zinc-800",
    );

    borderClasses = borders.filter(Boolean).join(" ");
  }

  // Determine background color based on selection state and vote mode
  const getBackgroundClass = () => {
    if (isSelected) {
      if (selectionTone === "staged") {
        return voteMode === VoteMode.AVAILABLE
          ? "bg-emerald-300 dark:bg-emerald-400"
          : "bg-rose-300 dark:bg-rose-400";
      }

      return voteMode === VoteMode.AVAILABLE
        ? "bg-emerald-500 dark:bg-emerald-600"
        : "bg-rose-500 dark:bg-rose-500";
    }
    if (isPartiallySelected) {
      // Striped pattern for partial selection
      return voteMode === VoteMode.AVAILABLE
        ? "bg-emerald-200 dark:bg-emerald-700"
        : "bg-rose-200 dark:bg-rose-800";
    }
    return "bg-white dark:bg-zinc-900";
  };

  return (
    <div
      data-slot-id={slot.id}
      data-row-index={rowIndex}
      data-date-index={dateIndex}
      data-merged-slot-ids={mergedSlotIdsAttr}
      onClick={() => onClick(rowIndex, dateIndex)}
      onMouseDown={(e) => onMouseDown(rowIndex, dateIndex, e)}
      onMouseEnter={() => onMouseEnter(rowIndex, dateIndex)}
      onTouchStart={(e) => onTouchStart(rowIndex, dateIndex, e)}
      className={`
        flex-1 min-w-0 relative
        cursor-pointer transition-colors duration-75
        ${borderClasses}
        ${getBackgroundClass()}
        ${!isDragging && !isSelected && !isPartiallySelected ? "hover:bg-gray-50 dark:hover:bg-zinc-800" : ""}
      `}
      style={{ height: "var(--slot-height, 2.5rem)" }}
    >
      {/* Partial selection indicator - diagonal stripes */}
      {isPartiallySelected && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              voteMode === VoteMode.AVAILABLE
                ? "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(16, 185, 129, 0.4) 4px, rgba(16, 185, 129, 0.4) 8px)"
                : "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(244, 63, 94, 0.4) 4px, rgba(244, 63, 94, 0.4) 8px)",
          }}
        />
      )}

      {/* Calendar events overlay - border style */}
      {showCalendarOnGrid && slotCalendarEvents.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {slotCalendarEvents.slice(0, 2).map((event, idx) => {
            const span = eventSpanById.get(event.id) ?? 0;
            if (span === 0) return null;

            const borderColors = [
              "border-orange-500 dark:border-orange-400",
              "border-purple-500 dark:border-purple-400",
            ];
            const textColors = [
              "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
              "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
            ];

            // Use CSS variable for slot height (set on parent grid container)
            const offset = idx === 0 ? 4 : 8;

            return (
              <div
                key={event.id}
                className={`absolute border-2 ${borderColors[idx % borderColors.length]} rounded ${
                  idx === 0 ? "left-0.5 right-0.5" : "left-1 right-1"
                }`}
                style={{
                  top: idx === 0 ? "2px" : "4px",
                  // Use CSS variable for precise height calculation (span = merged rows count)
                  height: `calc(${span} * var(--slot-height, 2.5rem) - ${offset}px)`,
                  zIndex: 10 + idx,
                }}
                title={`${event.summary}\n${formatEventTime(event, allDayLabel)}`}
              >
                {/* Event title badge at top */}
                <div
                  className={`absolute top-0.5 sm:top-1 left-0 right-0 flex justify-center`}
                  style={{ zIndex: 15 + idx }}
                >
                  <span
                    className={`px-1 text-[8px] sm:text-xs font-medium ${textColors[idx % textColors.length]} rounded truncate max-w-full leading-tight`}
                  >
                    {event.summary}
                  </span>
                </div>
              </div>
            );
          })}
          {slotCalendarEvents.length > 2 && (
            <div className="absolute bottom-0.5 right-0.5 text-[8px] bg-gray-800/70 text-white px-1 rounded z-20">
              +{slotCalendarEvents.length - 2}
            </div>
          )}
        </div>
      )}

      {/* Vote count indicator */}
      {voters.length > 0 && (
        <div
          className={`absolute bottom-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            isSelected
              ? selectionTone === "staged"
                ? voteMode === VoteMode.AVAILABLE
                  ? "bg-emerald-400 dark:bg-emerald-500 text-white"
                  : "bg-rose-400 dark:bg-rose-500 text-white"
                : voteMode === VoteMode.AVAILABLE
                  ? "bg-emerald-600 dark:bg-emerald-700 text-white"
                  : "bg-rose-600 dark:bg-rose-700 text-white"
              : isPartiallySelected
                ? voteMode === VoteMode.AVAILABLE
                  ? "bg-emerald-400 dark:bg-emerald-600 text-white"
                  : "bg-rose-400 dark:bg-rose-600 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
          }`}
        >
          {voters.length}
        </div>
      )}
    </div>
  );
});
