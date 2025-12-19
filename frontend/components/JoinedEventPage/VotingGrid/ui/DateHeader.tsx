"use client";

import { formatDateHeader } from "../utils";

interface DateHeaderProps {
  dates: string[];
  isDayFullySelected: (dateKey: string) => boolean;
  onSelectDay: (dateKey: string) => void;
}

export function DateHeader({
  dates,
  isDayFullySelected,
  onSelectDay,
}: DateHeaderProps) {
  return (
    <div className="flex">
      {/* Time column header */}
      <div className="w-20 shrink-0" />
      {/* Date columns */}
      {dates.map((dateKey) => {
        const { weekday, day, month } = formatDateHeader(dateKey);
        const isFullySelected = isDayFullySelected(dateKey);
        return (
          <button
            key={dateKey}
            onClick={() => onSelectDay(dateKey)}
            className={`flex-1 min-w-[60px] p-2 text-center cursor-pointer transition-all rounded-t-lg mx-0.5 ${
              isFullySelected
                ? "bg-blue-100 dark:bg-blue-900/30"
                : "hover:bg-gray-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
              {weekday}
            </div>
            <div
              className={`text-lg font-bold ${
                isFullySelected
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-900 dark:text-zinc-100"
              }`}
            >
              {day}
            </div>
            <div className="text-xs text-gray-400 dark:text-zinc-500">
              {month}
            </div>
          </button>
        );
      })}
    </div>
  );
}
