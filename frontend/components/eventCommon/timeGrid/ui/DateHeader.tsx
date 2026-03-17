"use client";

import { useLocale } from "next-intl";
import { GridAxisColumn } from "../types";
import { formatDateHeader } from "../utils";

interface DateHeaderProps {
  dates?: string[];
  columns?: GridAxisColumn[];
  isDayFullySelected?: (columnKey: string) => boolean;
  onSelectDay?: (columnKey: string) => void;
  firstTimeLabel?: string;
  isStickyActive?: boolean;
  selectable?: boolean;
}

export function DateHeader({
  dates = [],
  columns,
  isDayFullySelected,
  onSelectDay,
  firstTimeLabel,
  isStickyActive = false,
  selectable = true,
}: DateHeaderProps) {
  const locale = useLocale();
  const showBottomGridLine = isStickyActive;
  const axisColumns =
    columns ??
    dates.map((dateKey) => ({ key: dateKey, kind: "date", rawValue: dateKey }));

  return (
    <div className="relative flex">
      {/* Time column header - matches time column width */}
      <div className="w-9 sm:w-14 shrink-0 relative">
        {!isStickyActive && (
          <span className="absolute -bottom-1 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
            {firstTimeLabel}
          </span>
        )}
      </div>
      {/* Date columns */}
      {axisColumns.map((column) => {
        const { weekday, day, month } = formatDateHeader(
          column.rawValue,
          locale,
        );
        const isFullySelected = isDayFullySelected?.(column.key) ?? false;

        const content = (
          <>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">
              {weekday}
            </div>
            <div
              className={`text-sm sm:text-lg font-bold ${
                isFullySelected
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-900 dark:text-zinc-100"
              }`}
            >
              {day}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 dark:text-zinc-500">
              {month}
            </div>
          </>
        );

        if (!selectable) {
          return (
            <div
              key={column.key}
              className="flex-1 min-w-0 p-1 sm:p-2 text-center rounded-t-lg mx-px sm:mx-0.5"
            >
              {content}
            </div>
          );
        }

        return (
          <button
            key={column.key}
            onClick={() => onSelectDay?.(column.key)}
            className={`flex-1 min-w-0 p-1 sm:p-2 text-center cursor-pointer transition-all rounded-t-lg mx-px sm:mx-0.5 ${
              isFullySelected
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
          >
            {content}
          </button>
        );
      })}

      {showBottomGridLine && (
        <div className="pointer-events-none absolute bottom-0 left-9 sm:left-14 right-0 border-b border-gray-200 dark:border-zinc-700" />
      )}
    </div>
  );
}
