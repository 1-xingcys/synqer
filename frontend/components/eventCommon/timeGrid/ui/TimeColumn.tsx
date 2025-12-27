"use client";

import { memo } from "react";
import { formatTime } from "../utils";
import { MergedTimeRow } from "../types";

interface TimeColumnProps {
  mergedRows: MergedTimeRow[];
}

export const TimeColumn = memo(function TimeColumn({
  mergedRows,
}: TimeColumnProps) {
  return (
    <div className="w-9 sm:w-14 shrink-0 relative border-r border-gray-200 dark:border-zinc-700 rounded-l-lg">
      {mergedRows.map((row, rowIndex) => (
        <div key={rowIndex} className="h-10 sm:h-11 relative">
          {/* Time label at top boundary */}
          <span className="absolute -top-2 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
            {formatTime(row.startMinute)}
          </span>
        </div>
      ))}
      {/* Last time label */}
      {mergedRows.length > 0 && (
        <span className="absolute bottom-0.5 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
          {formatTime(mergedRows[mergedRows.length - 1].endMinute)}
        </span>
      )}
    </div>
  );
});
