"use client";

import { useTranslations } from "next-intl";
import { CalendarEvent } from "../types";
import { formatEventTime } from "../utils";

interface GoogleCalendarPanelProps {
  eventId?: string;
  calendarStatus: { connected: boolean; googleEmail?: string } | null;
  calendarLoading: boolean;
  calendarEvents: CalendarEvent[];
  conflictingSlotIds: string[];
  loadingCalendar: boolean;
  showCalendarPanel: boolean;
  showCalendarOnGrid: boolean;
  setShowCalendarPanel: (show: boolean) => void;
  setShowCalendarOnGrid: (show: boolean) => void;
  connectCalendar: () => void;
  loadCalendarConflicts: () => Promise<void>;
  markConflictsAsUnavailable: () => void;
}

export function GoogleCalendarPanel({
  eventId,
  calendarStatus,
  calendarLoading,
  calendarEvents,
  conflictingSlotIds,
  loadingCalendar,
  showCalendarPanel,
  showCalendarOnGrid,
  setShowCalendarPanel,
  setShowCalendarOnGrid,
  connectCalendar,
  loadCalendarConflicts,
  markConflictsAsUnavailable,
}: GoogleCalendarPanelProps) {
  const tJoined = useTranslations("joined");

  if (!eventId) return null;

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-zinc-800/80 dark:to-zinc-800/50 rounded-xl border border-blue-100 dark:border-zinc-700">
      {/* Header - always visible */}
      <button
        onClick={() => setShowCalendarPanel(!showCalendarPanel)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {/* Google Calendar Icon */}
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="4"
                width="18"
                height="17"
                rx="2"
                stroke="#4285F4"
                strokeWidth="2"
              />
              <path d="M3 9H21" stroke="#4285F4" strokeWidth="2" />
              <path
                d="M9 4V7"
                stroke="#4285F4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M15 4V7"
                stroke="#4285F4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect x="7" y="12" width="3" height="3" rx="0.5" fill="#EA4335" />
              <rect
                x="11"
                y="12"
                width="3"
                height="3"
                rx="0.5"
                fill="#FBBC05"
              />
              <rect x="7" y="16" width="3" height="2" rx="0.5" fill="#34A853" />
              <rect
                x="11"
                y="16"
                width="3"
                height="2"
                rx="0.5"
                fill="#4285F4"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-zinc-100">
              {tJoined("googleCalendar.title")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {calendarStatus?.connected
                ? tJoined("googleCalendar.connectedAs", {
                    email: calendarStatus.googleEmail || "",
                  })
                : tJoined("googleCalendar.connectHint")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection status badge */}
          {!calendarLoading && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                calendarStatus?.connected
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
              }`}
            >
              {calendarStatus?.connected
                ? tJoined("googleCalendar.connected")
                : tJoined("googleCalendar.notConnected")}
            </span>
          )}
          {/* Expand/collapse icon */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showCalendarPanel ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded panel */}
      {showCalendarPanel && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-100 dark:border-zinc-700 pt-4">
          {/* Not connected - show connect button */}
          {!calendarStatus?.connected && (
            <button
              onClick={() => connectCalendar()}
              disabled={calendarLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-gray-700 dark:text-zinc-300">
                {tJoined("googleCalendar.connect")}
              </span>
            </button>
          )}

          {/* Connected - show calendar events and conflicts */}
          {calendarStatus?.connected && (
            <>
              {/* Loading state */}
              {loadingCalendar && (
                <div className="flex items-center justify-center py-4">
                  <svg
                    className="w-5 h-5 animate-spin text-blue-500"
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
                  <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">
                    {tJoined("googleCalendar.importing")}
                  </span>
                </div>
              )}

              {/* Conflicts found */}
              {!loadingCalendar && conflictingSlotIds.length > 0 && (
                <div className="space-y-3">
                  {/* Toggle to show calendar on grid */}
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-zinc-300">
                        {tJoined("googleCalendar.showOnGrid")}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCalendarOnGrid(!showCalendarOnGrid)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        showCalendarOnGrid
                          ? "bg-orange-500"
                          : "bg-gray-300 dark:bg-zinc-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          showCalendarOnGrid
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {tJoined("googleCalendar.conflictsFound", {
                        count: conflictingSlotIds.length,
                      })}
                    </p>
                    <button
                      onClick={markConflictsAsUnavailable}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      {tJoined("googleCalendar.markAsUnavailable")}
                    </button>
                  </div>

                  {/* Calendar events list */}
                  {calendarEvents.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                      {calendarEvents.map((event, idx) => {
                        const colors = [
                          "bg-orange-400",
                          "bg-purple-400",
                          "bg-blue-400",
                          "bg-pink-400",
                        ];
                        return (
                          <div
                            key={event.id}
                            className="px-3 py-2 flex items-start gap-2"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${colors[idx % colors.length]} mt-1.5 shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                {event.summary}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                {formatEventTime(
                                  event,
                                  tJoined("googleCalendar.allDay"),
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* No conflicts */}
              {!loadingCalendar &&
                conflictingSlotIds.length === 0 &&
                calendarEvents.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {tJoined("googleCalendar.noConflicts")}
                    </p>
                  </div>
                )}

              {/* Refresh button */}
              {!loadingCalendar && (
                <button
                  onClick={() => void loadCalendarConflicts()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {tJoined("googleCalendar.import")}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
