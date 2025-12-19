"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { EventStatusBadge } from "@/components/Events/EventStatusBadge";
import { EventStatus } from "@/types/event";

export default function JoinedEventsPage() {
  const t = useTranslations();
  const { events, loading, error } = useAttendedEvents();

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("dashboard.loadingEvents")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-red-600 dark:text-red-400">
            {t("dashboard.errorLoadingEvents")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("joined.title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t("joined.description")}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-400 dark:text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            {t("joined.noEvents")}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("joined.noEventsDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/joined/${event.id}`}
              className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title || t("event.untitled")}
                    </h3>
                    <EventStatusBadge status={event.status} size="sm" />
                  </div>
                  {event.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {format(new Date(event.startDate), "MMM d")} -{" "}
                      {format(new Date(event.endDate), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t("dashboard.participants", {
                        count: event.participantCount,
                      })}
                    </span>
                    {event.confirmedStartTime && (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {format(
                          new Date(event.confirmedStartTime),
                          "MMM d, HH:mm",
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {/* 投票狀態指示器 */}
                  {event.status === EventStatus.VOTING && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        event.hasVoted
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {event.hasVoted ? (
                        <>
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {t("participantStatus.voted")}
                        </>
                      ) : (
                        <>
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {t("participantStatus.notVoted")}
                        </>
                      )}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
                    {t("joined.viewEvent")}
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
