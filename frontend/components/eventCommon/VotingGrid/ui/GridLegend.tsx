"use client";

import { useTranslations } from "next-intl";
import { VoteMode, CalendarEvent } from "../types";

interface GridLegendProps {
  voteMode: VoteMode;
  showCalendarOnGrid: boolean;
  calendarEvents: CalendarEvent[];
}

export function GridLegend({
  voteMode,
  showCalendarOnGrid,
  calendarEvents,
}: GridLegendProps) {
  const tJoined = useTranslations("joined");

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-zinc-400">
      {voteMode === "available" ? (
        <>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
            <span>{tJoined("legendAvailable")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
            <span>{tJoined("legendUnavailable")}</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-rose-500 dark:bg-rose-600" />
            <span>{tJoined("legendUnavailable")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
            <span>{tJoined("legendAvailable")}</span>
          </div>
        </>
      )}
      {/* Calendar event legend */}
      {showCalendarOnGrid && calendarEvents.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400/80 dark:bg-orange-500/70" />
          <span>{tJoined("googleCalendar.legendCalendarEvent")}</span>
        </div>
      )}
    </div>
  );
}
