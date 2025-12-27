"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { EventStatusBadge } from "@/components/eventCommon/EventStatusBadge";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { EventPublicInfo } from "./useEventJoin";

interface JoinConfirmViewProps {
  eventInfo: EventPublicInfo;
  joining: boolean;
  onJoin: () => void;
}

export function JoinConfirmView({
  eventInfo,
  joining,
  onJoin,
}: JoinConfirmViewProps) {
  const t = useTranslations();

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-br from-blue-500 to-indigo-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg
                className="w-8 h-8"
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
            </div>
            <p className="text-blue-100 text-sm mb-1">
              {t("eventJoin.youAreInvited")}
            </p>
            <h1 className="text-2xl font-bold">
              {eventInfo.title || t("event.untitled")}
            </h1>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <EventStatusBadge status={eventInfo.status} />
            </div>

            {/* Description */}
            {eventInfo.description && (
              <p className="text-zinc-600 dark:text-zinc-400 text-center">
                {eventInfo.description}
              </p>
            )}

            {/* Event Details */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              {/* Date Range */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {t("eventJoin.votingDateRange")}
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {format(new Date(eventInfo.startDate), "MMM d")} -{" "}
                    {format(new Date(eventInfo.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Voting Deadline */}
              {eventInfo.votingDeadline && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-amber-600 dark:text-amber-400"
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
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {t("eventJoin.votingDeadline")}
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {format(
                        new Date(eventInfo.votingDeadline),
                        "MMM d, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmed Time Slots */}
              {eventInfo.confirmedTimeRanges &&
                eventInfo.confirmedTimeRanges.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600 dark:text-green-400"
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
                    <div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                        {t("eventJoin.confirmedTime")}
                      </p>
                      <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                        <ConfirmedTimeDisplay
                          timeRanges={eventInfo.confirmedTimeRanges}
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Participants */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {t("eventJoin.currentParticipants")}
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {t("dashboard.participants", {
                      count: eventInfo.participantCount,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={onJoin}
                disabled={joining}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("eventJoin.joining")}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    {t("eventJoin.joinEvent")}
                  </>
                )}
              </button>
              <Link
                href="/joined"
                className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-center"
              >
                {t("eventJoin.cancel")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
