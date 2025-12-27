"use client";

import { useTranslations } from "next-intl";
import { TimeSlot, CalendarEvent } from "../types";
import { VoteMode } from "@/types/event";
import { formatEventTime } from "../utils";

interface MergedRectBounds {
  minRow: number;
  maxRow: number;
  minDate: number;
  maxDate: number;
}

interface TimeSlotCellProps {
  slot: TimeSlot;
  rowIndex: number;
  dateIndex: number;
  isSelected: boolean;
  isPartiallySelected?: boolean;
  isHovered: boolean;
  isLongPressed: boolean;
  isDragging: boolean;
  inRectangle: boolean;
  mergedRectBounds: MergedRectBounds | null;
  voteMode: VoteMode;
  voters: string[];
  slotCalendarEvents: CalendarEvent[];
  showCalendarOnGrid: boolean;
  // For merged rows: check if event starts in this merged row
  isEventStartInMergedRow?: (event: CalendarEvent) => boolean;
  // For merged rows: get span in merged rows (not 15-min slots)
  getEventSpanInMergedRows?: (event: CalendarEvent) => number;
  mergedSlotIds?: string[]; // IDs of all slots in this merged cell
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onClick: () => void;
}

export function TimeSlotCell({
  slot,
  rowIndex,
  dateIndex,
  isSelected,
  isPartiallySelected = false,
  isHovered,
  isLongPressed,
  isDragging,
  inRectangle,
  mergedRectBounds,
  voteMode,
  voters,
  slotCalendarEvents,
  showCalendarOnGrid,
  isEventStartInMergedRow,
  getEventSpanInMergedRows,
  mergedSlotIds,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
}: TimeSlotCellProps) {
  const tJoined = useTranslations("joined");
  const showTooltip =
    (isHovered || isLongPressed) && voters.length > 0 && !isDragging;

  // Determine border style for rectangle selection
  // Only show blue border on the outer edges of the selection rectangle
  let borderClasses = "border-r border-b border-gray-100 dark:border-zinc-800";
  if (isDragging && mergedRectBounds && inRectangle) {
    const isTopEdge = rowIndex === mergedRectBounds.minRow;
    const isBottomEdge = rowIndex === mergedRectBounds.maxRow;
    const isLeftEdge = dateIndex === mergedRectBounds.minDate;
    const isRightEdge = dateIndex === mergedRectBounds.maxDate;

    // Build border classes - only outer edges get blue border
    const borders = [];

    // Top border: blue if top edge, else transparent (no internal lines)
    borders.push(
      isTopEdge ? "border-t-2 border-t-blue-500 dark:border-t-blue-400" : "",
    );

    // Bottom border: blue if bottom edge, else normal grid line
    borders.push(
      isBottomEdge
        ? "border-b-2 border-b-blue-500 dark:border-b-blue-400"
        : "border-b border-b-gray-100 dark:border-b-zinc-800",
    );

    // Left border: blue if left edge, else transparent (no internal lines)
    borders.push(
      isLeftEdge ? "border-l-2 border-l-blue-500 dark:border-l-blue-400" : "",
    );

    // Right border: blue if right edge, else normal grid line
    borders.push(
      isRightEdge
        ? "border-r-2 border-r-blue-500 dark:border-r-blue-400"
        : "border-r border-r-gray-100 dark:border-r-zinc-800",
    );

    borderClasses = borders.filter(Boolean).join(" ");
  }

  // Determine background color based on selection state and vote mode
  const getBackgroundClass = () => {
    if (isSelected) {
      return voteMode === VoteMode.AVAILABLE
        ? "bg-emerald-500 dark:bg-emerald-600"
        : "bg-rose-500 dark:bg-rose-600";
    }
    if (isPartiallySelected) {
      // Striped pattern for partial selection
      return voteMode === VoteMode.AVAILABLE
        ? "bg-emerald-200 dark:bg-emerald-800/50"
        : "bg-rose-200 dark:bg-rose-800/50";
    }
    return "bg-white dark:bg-zinc-900";
  };

  return (
    <div
      data-slot-id={slot.id}
      data-row-index={rowIndex}
      data-date-index={dateIndex}
      data-merged-slot-ids={mergedSlotIds?.join(",")}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`
        flex-1 min-w-0 relative
        cursor-pointer transition-colors duration-75
        ${borderClasses}
        ${getBackgroundClass()}
        ${!isDragging && isHovered && !isSelected && !isPartiallySelected ? "bg-gray-50 dark:bg-zinc-800" : ""}
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
            // Use merged row functions if available, otherwise skip
            const isStart = isEventStartInMergedRow
              ? isEventStartInMergedRow(event)
              : false;
            const span =
              isStart && getEventSpanInMergedRows
                ? getEventSpanInMergedRows(event)
                : 0;

            // Only render on the start row
            if (!isStart || span === 0) return null;

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
                title={`${event.summary}\n${formatEventTime(event, tJoined("googleCalendar.allDay"))}`}
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
              ? voteMode === VoteMode.AVAILABLE
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

      {/* Tooltip showing voters */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
          <div className="bg-gray-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
            <div className="font-medium mb-1 text-gray-300 dark:text-zinc-300">
              {tJoined("votersForSlot")}
            </div>
            {voters.map((voter, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                {voter}
              </div>
            ))}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-zinc-700" />
          </div>
        </div>
      )}
    </div>
  );
}
