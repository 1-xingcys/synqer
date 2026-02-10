"use client";

import { useLocale } from "next-intl";
import { formatDateHeader } from "../utils";

interface DateHeaderProps {
  dates: string[];
  isDayFullySelected: (dateKey: string) => boolean;
  onSelectDay: (dateKey: string) => void;
  firstTimeLabel?: string;
  isStickyActive: boolean;
}

export function DateHeader({
  dates,
  isDayFullySelected,
  onSelectDay,
  firstTimeLabel,
  isStickyActive = false,
}: DateHeaderProps) {
  const locale = useLocale();
  const showBottomGridLine = isStickyActive;

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
      {dates.map((dateKey) => {
        const { weekday, day, month } = formatDateHeader(dateKey, locale);
        const isFullySelected = isDayFullySelected(dateKey);
        return (
          <button
            key={dateKey}
            onClick={() => onSelectDay(dateKey)}
            className={`flex-1 min-w-0 p-1 sm:p-2 text-center cursor-pointer transition-all rounded-t-lg mx-px sm:mx-0.5 ${
              isFullySelected
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
          >
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
          </button>
        );
      })}

      {showBottomGridLine && (
        <div className="pointer-events-none absolute bottom-0 left-9 sm:left-14 right-0 border-b border-gray-200 dark:border-zinc-700" />
      )}
    </div>
  );
}
