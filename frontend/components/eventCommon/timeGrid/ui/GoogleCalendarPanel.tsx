"use client";

import { useTranslations } from "next-intl";

interface GoogleCalendarPanelProps {
  eventId?: string;
  calendarStatus: { connected: boolean; googleEmail?: string } | null;
  calendarLoading: boolean;
  conflictingSlotIds: string[];
  loadingCalendar: boolean;
  showCalendarOnGrid: boolean;
  setShowCalendarOnGrid: (show: boolean) => void;
  connectCalendar: () => void;
  disconnectCalendar: () => Promise<void>;
  markConflictsAsUnavailable: () => void;
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
        fill={GoogleColors.blue}
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill={GoogleColors.green}
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill={GoogleColors.yellow}
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill={GoogleColors.red}
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GoogleCalendarPanel({
  eventId,
  calendarStatus,
  calendarLoading,
  conflictingSlotIds,
  loadingCalendar,
  showCalendarOnGrid,
  setShowCalendarOnGrid,
  connectCalendar,
  disconnectCalendar,
  markConflictsAsUnavailable,
}: GoogleCalendarPanelProps) {
  const tJoined = useTranslations("joined");

  if (!eventId) return null;

  const isConnected = calendarStatus?.connected;

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 dark:from-zinc-800/80 dark:via-zinc-800/60 dark:to-zinc-800/80 rounded-xl border border-blue-100 dark:border-zinc-700 p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Google Calendar Icon */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center border border-gray-100 dark:border-zinc-700 shrink-0">
              <GoogleCalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-[13px] sm:text-sm">
                Google Calendar
              </h3>
              {isConnected && calendarStatus?.googleEmail && (
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 truncate">
                  {calendarStatus.googleEmail}
                </p>
              )}
            </div>
          </div>

          {/* Connect / Disconnect Button - Always in top right */}
          {!isConnected ? (
            <button
              onClick={() => connectCalendar()}
              disabled={calendarLoading}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              {calendarLoading ? (
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <GoogleGIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="text-[13px] sm:text-sm font-medium text-gray-700 dark:text-zinc-300">
                Connect
              </span>
            </button>
          ) : (
            <button
              onClick={() => void disconnectCalendar()}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
            >
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
              {tJoined("googleCalendar.disconnect")}
            </button>
          )}
        </div>

        {/* Connected State - Show controls */}
        {isConnected && (
          <>
            {/* Loading calendar events */}
            {loadingCalendar && (
              <div className="flex items-center gap-2 text-[13px] sm:text-sm text-gray-500 dark:text-zinc-400 py-1 sm:py-2">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{tJoined("googleCalendar.importing")}</span>
              </div>
            )}

            {!loadingCalendar && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-blue-100/50 dark:border-zinc-700/50">
                {/* Show on grid toggle */}
                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showCalendarOnGrid}
                      onChange={(e) => setShowCalendarOnGrid(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full transition-colors ${
                        showCalendarOnGrid
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-zinc-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow transition-transform ${
                          showCalendarOnGrid
                            ? "translate-x-[18px] sm:translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300">
                    {tJoined("googleCalendar.showOnGrid")}
                  </span>
                </label>

                {/* Mark all as unavailable - only when show on grid is enabled */}
                {showCalendarOnGrid && conflictingSlotIds.length > 0 && (
                  <button
                    onClick={markConflictsAsUnavailable}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    {tJoined("googleCalendar.markAsUnavailable")} (
                    {conflictingSlotIds.length} slots)
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
