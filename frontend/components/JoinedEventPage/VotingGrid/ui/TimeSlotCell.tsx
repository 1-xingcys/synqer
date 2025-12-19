"use client";

import { useTranslations } from "next-intl";
import { TimeSlot, VoteMode, CalendarEvent, RectangleBounds } from "../types";
import { formatEventTime } from "../utils";

interface TimeSlotCellProps {
  slot: TimeSlot;
  dateIndex: number;
  timeIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  isLongPressed: boolean;
  isDragging: boolean;
  inRectangle: boolean;
  rectangleBounds: RectangleBounds | null;
  voteMode: VoteMode;
  voters: string[];
  slotCalendarEvents: CalendarEvent[];
  showCalendarOnGrid: boolean;
  isEventStartInSlot: (slotId: string, event: CalendarEvent) => boolean;
  getEventSpanFromSlot: (slotId: string, event: CalendarEvent) => number;
  onMouseDown: (slotId: string, e: React.MouseEvent) => void;
  onMouseEnter: (slotId: string) => void;
  onTouchStart: (slotId: string, e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function TimeSlotCell({
  slot,
  dateIndex,
  timeIndex,
  isSelected,
  isHovered,
  isLongPressed,
  isDragging,
  inRectangle,
  rectangleBounds,
  voteMode,
  voters,
  slotCalendarEvents,
  showCalendarOnGrid,
  isEventStartInSlot,
  getEventSpanFromSlot,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: TimeSlotCellProps) {
  const tJoined = useTranslations("joined");
  const showTooltip =
    (isHovered || isLongPressed) && voters.length > 0 && !isDragging;

  // Determine border style for rectangle selection
  let borderClasses = "border-r border-b border-gray-100 dark:border-zinc-800";
  if (isDragging && rectangleBounds && inRectangle) {
    const isTopEdge = timeIndex === rectangleBounds.minTime;
    const isBottomEdge = timeIndex === rectangleBounds.maxTime;
    const isLeftEdge = dateIndex === rectangleBounds.minDate;
    const isRightEdge = dateIndex === rectangleBounds.maxDate;

    borderClasses = `
      ${isTopEdge ? "border-t-2 border-t-blue-500 dark:border-t-blue-400" : "border-t border-t-transparent"}
      ${isBottomEdge ? "border-b-2 border-b-blue-500 dark:border-b-blue-400" : "border-b border-b-gray-100 dark:border-b-zinc-800"}
      ${isLeftEdge ? "border-l-2 border-l-blue-500 dark:border-l-blue-400" : "border-l border-l-transparent"}
      ${isRightEdge ? "border-r-2 border-r-blue-500 dark:border-r-blue-400" : "border-r border-r-gray-100 dark:border-r-zinc-800"}
    `;
  }

  // Determine background color based on vote mode
  const getBackgroundClass = () => {
    if (isSelected) {
      return voteMode === "available"
        ? "bg-emerald-500 dark:bg-emerald-600"
        : "bg-rose-500 dark:bg-rose-600";
    }
    return "bg-white dark:bg-zinc-900";
  };

  return (
    <div
      data-slot-id={slot.id}
      onMouseDown={(e) => onMouseDown(slot.id, e)}
      onMouseEnter={() => onMouseEnter(slot.id)}
      onTouchStart={(e) => onTouchStart(slot.id, e)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`
        flex-1 min-w-[60px] min-h-[44px] relative
        cursor-pointer transition-colors duration-75
        ${borderClasses}
        ${getBackgroundClass()}
        ${!isDragging && isHovered && !isSelected ? "bg-gray-50 dark:bg-zinc-800" : ""}
        ${inRectangle ? "ring-inset ring-1 ring-blue-400/50" : ""}
      `}
    >
      {/* Calendar events overlay */}
      {showCalendarOnGrid && slotCalendarEvents.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {slotCalendarEvents.slice(0, 2).map((event, idx) => {
            const isStart = isEventStartInSlot(slot.id, event);
            const span = isStart ? getEventSpanFromSlot(slot.id, event) : 0;

            const colors = [
              "bg-orange-400/80 dark:bg-orange-500/70",
              "bg-purple-400/80 dark:bg-purple-500/70",
            ];

            return (
              <div
                key={event.id}
                className={`absolute left-0.5 right-0.5 ${colors[idx % colors.length]} ${
                  isStart ? "rounded-t" : ""
                } ${idx === 0 ? "top-0.5" : "top-5"}`}
                style={{
                  height:
                    isStart && span > 1
                      ? `calc(${span * 100}% - 4px)`
                      : idx === 0
                        ? "calc(100% - 4px)"
                        : "calc(50% - 2px)",
                  zIndex: 10 + idx,
                }}
                title={`${event.summary}\n${formatEventTime(event, tJoined("googleCalendar.allDay"))}`}
              >
                {isStart && (
                  <div className="px-1 py-0.5 text-[9px] font-medium text-white truncate leading-tight">
                    {event.summary}
                  </div>
                )}
              </div>
            );
          })}
          {slotCalendarEvents.length > 2 && (
            <div className="absolute bottom-0.5 right-0.5 text-[8px] bg-gray-800/70 text-white px-1 rounded">
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
              ? voteMode === "available"
                ? "bg-emerald-600 dark:bg-emerald-700 text-white"
                : "bg-rose-600 dark:bg-rose-700 text-white"
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
