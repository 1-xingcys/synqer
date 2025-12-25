"use client";

import { useTranslations } from "next-intl";
import { ConfirmedTimeRange } from "@/types/event";

interface AddToCalendarPanelProps {
  eventTitle: string;
  eventDescription?: string | null;
  confirmedTimeRanges: ConfirmedTimeRange[];
}

// Google brand colors
const GoogleColors = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
};

function GoogleCalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        stroke={GoogleColors.blue}
        strokeWidth="2"
      />
      <path d="M3 9H21" stroke={GoogleColors.blue} strokeWidth="2" />
      <path
        d="M9 4V7"
        stroke={GoogleColors.blue}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 4V7"
        stroke={GoogleColors.blue}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="7"
        y="12"
        width="3"
        height="3"
        rx="0.5"
        fill={GoogleColors.red}
      />
      <rect
        x="11"
        y="12"
        width="3"
        height="3"
        rx="0.5"
        fill={GoogleColors.yellow}
      />
      <rect
        x="7"
        y="16"
        width="3"
        height="2"
        rx="0.5"
        fill={GoogleColors.green}
      />
      <rect
        x="11"
        y="16"
        width="3"
        height="2"
        rx="0.5"
        fill={GoogleColors.blue}
      />
    </svg>
  );
}

function GoogleGIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Format date for Google Calendar URL
 * Format: YYYYMMDDTHHMMSSZ (for UTC) or YYYYMMDDTHHMMSS (for local)
 */
function formatGoogleCalendarDate(dateStr: string): string {
  const date = new Date(dateStr);
  // Format as local time without timezone suffix
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Generate Google Calendar URL for adding an event
 */
function generateGoogleCalendarUrl(
  title: string,
  description: string | undefined,
  startTime: string,
  endTime: string,
): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleCalendarDate(startTime)}/${formatGoogleCalendarDate(endTime)}`,
  });

  if (description) {
    params.set("details", description);
  }

  return `${baseUrl}?${params.toString()}`;
}

export function AddToCalendarPanel({
  eventTitle,
  eventDescription,
  confirmedTimeRanges,
}: AddToCalendarPanelProps) {
  const t = useTranslations("joined");

  if (confirmedTimeRanges.length === 0) {
    return null;
  }

  const handleAddToCalendar = (range: ConfirmedTimeRange) => {
    const url = generateGoogleCalendarUrl(
      eventTitle || t("untitledEvent"),
      eventDescription || undefined,
      range.startTime,
      range.endTime,
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatTimeRange = (range: ConfirmedTimeRange) => {
    const start = new Date(range.startTime);
    const end = new Date(range.endTime);

    // 後端使用 UTC 時間儲存，前端顯示時也要用 UTC
    const dateFormatter = new Intl.DateTimeFormat("en", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
      timeZone: "UTC",
    });
    const timeFormatter = new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });

    const sameDay =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth() &&
      start.getUTCDate() === end.getUTCDate();

    if (sameDay) {
      return `${dateFormatter.format(start)} ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
    }
    return `${dateFormatter.format(start)} ${timeFormatter.format(start)} - ${dateFormatter.format(end)} ${timeFormatter.format(end)}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 dark:from-zinc-800/80 dark:via-zinc-800/60 dark:to-zinc-800/80 rounded-xl border border-blue-100 dark:border-zinc-700 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Google Calendar Icon */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center border border-gray-100 dark:border-zinc-700 shrink-0">
              <GoogleCalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-[13px] sm:text-sm">
                {t("addToCalendar.title")}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400">
                {t("addToCalendar.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Time Ranges */}
        <div className="space-y-2">
          {confirmedTimeRanges.map((range, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2.5 sm:p-3 border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="w-4 h-4 text-green-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">
                  {formatTimeRange(range)}
                </span>
              </div>
              <button
                onClick={() => handleAddToCalendar(range)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-xs font-medium text-gray-700 dark:text-zinc-200 shadow-sm"
              >
                <GoogleGIcon className="w-3.5 h-3.5" />
                {t("addToCalendar.add")}
              </button>
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t("addToCalendar.hint")}
        </p>
      </div>
    </div>
  );
}
