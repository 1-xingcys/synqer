"use client";

import { useTranslations } from "next-intl";
import { EventStatus, ConfirmedTimeRange } from "@/types/event";
import { EventStatusBadge } from "@/components/eventCommon/EventStatusBadge";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { format, isPast, differenceInHours } from "date-fns";

interface EventInfoCompactProps {
  title?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  status: EventStatus;
  hasVoted?: boolean;
  confirmedTimeRanges?: ConfirmedTimeRange[];
  votingDeadline?: string | null;
}

export function EventInfoCompact({
  title,
  description,
  startDate,
  endDate,
  startMinuteOfDay,
  endMinuteOfDay,
  status,
  hasVoted,
  confirmedTimeRanges = [],
  votingDeadline,
}: EventInfoCompactProps) {
  const t = useTranslations();

  const formatTime = (minuteOfDay: number) => {
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const isVotingPhase =
    status === EventStatus.VOTING || status === EventStatus.VOTING_ENDED;
  const hasConfirmedTime = confirmedTimeRanges.length > 0;

  // Check if deadline is urgent (within 24 hours)
  const deadlineDate = votingDeadline ? new Date(votingDeadline) : null;
  const isDeadlineUrgent =
    deadlineDate &&
    !isPast(deadlineDate) &&
    differenceInHours(deadlineDate, new Date()) < 24;
  const isDeadlinePast = deadlineDate && isPast(deadlineDate);

  // Status descriptions
  const statusDescriptions: Record<EventStatus, string> = {
    [EventStatus.VOTING]: t("eventInfo.statusDesc.voting"),
    [EventStatus.VOTING_ENDED]: t("eventInfo.statusDesc.votingEnded"),
    [EventStatus.CONFIRMED]: t("eventInfo.statusDesc.confirmed"),
    [EventStatus.COMPLETED]: t("eventInfo.statusDesc.completed"),
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
      {/* Header Row: Title + Status | Voted Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title + Status */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title || t("event.untitled")}
            </h1>
            <EventStatusBadge status={status} size="sm" />
          </div>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Voted Status - Top Right */}
        {hasVoted !== undefined && (
          <div className="shrink-0">
            {hasVoted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("joined.voted")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("joined.notVoted")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {/* Date Range */}
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <svg
            className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500"
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
          {isVotingPhase ? (
            <span>
              {format(new Date(startDate), "M/d")} -{" "}
              {format(new Date(endDate), "M/d")}
            </span>
          ) : hasConfirmedTime ? (
            <ConfirmedTimeDisplay
              timeRanges={confirmedTimeRanges}
              preview
              className="truncate"
            />
          ) : (
            <span>
              {format(new Date(startDate), "M/d")} -{" "}
              {format(new Date(endDate), "M/d")}
            </span>
          )}
        </div>

        {/* Time Range - only show for voting phase */}
        {isVotingPhase && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <svg
              className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500"
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
            <span className="font-mono text-xs">
              {formatTime(startMinuteOfDay)} - {formatTime(endMinuteOfDay)}
            </span>
          </div>
        )}

        {/* Voting Deadline - more prominent */}
        {isVotingPhase && deadlineDate && (
          <div
            className={`flex items-center gap-2 px-2 py-0.5 rounded-md ${
              isDeadlinePast
                ? "text-zinc-500 dark:text-zinc-400"
                : isDeadlineUrgent
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs font-medium">
              {t("eventInfo.deadline")}: {format(deadlineDate, "M/d HH:mm")}
            </span>
          </div>
        )}
      </div>

      {/* Status Description */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          {statusDescriptions[status]}
        </p>
      </div>
    </div>
  );
}
