"use client";

import { memo } from "react";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";
import { MergedTimeRow } from "../types";

interface TimeColumnProps {
  mergedTimeRows: MergedTimeRow[];
  slotHeight: string;
  showFirstBoundaryLabel?: boolean;
}

export const TimeColumn = memo(function TimeColumn({
  mergedTimeRows,
  slotHeight,
  showFirstBoundaryLabel = true,
}: TimeColumnProps) {
  return (
    <div
      className="w-9 sm:w-14 shrink-0 relative border-r border-gray-200 dark:border-zinc-700 rounded-l-lg touch-pan-y"
      style={
        {
          "--slot-height": slotHeight,
          touchAction: "pan-y",
        } as React.CSSProperties
      }
    >
      {mergedTimeRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="relative"
          style={{ height: "var(--slot-height)" }}
        >
          {/* Time label at top boundary */}
          {(showFirstBoundaryLabel || rowIndex !== 0) && (
            <span className="absolute -top-2 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
              {formatMinutesToTime(row.startMinute)}
            </span>
          )}
        </div>
      ))}
      {/* Last time label */}
      {mergedTimeRows.length > 0 && (
        <span className="absolute bottom-0.5 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
          {formatMinutesToTime(
            mergedTimeRows[mergedTimeRows.length - 1].endMinute,
          )}
        </span>
      )}
    </div>
  );
});
