"use client";

import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, Globe, Timer } from "lucide-react";
import { formatMinutesToTime } from "@/lib/utils";
import { formatDateInZone } from "@/lib/time";
import { formatVotingDeadlineWallClock } from "@/lib/votingDeadline";
import { EventStatusText } from "@/components/eventCommon/EventStatusText";
import { VoteStatusText } from "@/components/eventCommon/VoteStatusText";
import { EventSchedule, EventStatus, EventType } from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";

interface EventInfoDetailProps {
  eventType: EventType;
  status: EventStatus;
  schedule: EventSchedule;
  timeZone: string;
  votingDeadline?: string | null;
  currentUserHasVoted: boolean;
}

export function EventInfoDetail({
  eventType,
  status,
  schedule,
  timeZone,
  votingDeadline,
  currentUserHasVoted,
}: EventInfoDetailProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRecurring = eventType === "RECURRING";
  const recurringWeekdays =
    schedule.kind === "RECURRING" ? schedule.weekdays : undefined;
  const candidateDayText =
    isRecurring && recurringWeekdays?.length
      ? recurringWeekdays
          .map((weekday) => formatWeekdayLabel(weekday, locale))
          .join(", ")
      : schedule.kind === "ONE_TIME"
        ? [
            formatDateInZone(new Date(schedule.startDate), "UTC"),
            formatDateInZone(new Date(schedule.endDate), "UTC"),
          ].join(" ~ ")
        : "-";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {t("eventInfo.status")}
          </span>
          <EventStatusText status={status} />
        </div>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {t("eventInfo.myVotingStatus")}
          </span>
          <VoteStatusText hasVoted={currentUserHasVoted} />
        </div>
      </div>

      {/* Candidate Info Section */}
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2 mt-4">
        <Calendar className="w-5 h-5" />
        {t("eventInfo.candidateInfo")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isRecurring
                ? t("eventInfo.candidateWeekdays")
                : t("eventInfo.candidateDates")}
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-6">
            {candidateDayText}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("eventInfo.candidateTime")}
            </span>
          </div>
          <p className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-mono pl-6">
            {formatMinutesToTime(schedule.startMinuteOfDay ?? 0)}
            <span className="mx-2 text-zinc-400">~</span>
            {formatMinutesToTime(schedule.endMinuteOfDay ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("eventInfo.timeZone")}
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-6">
            {timeZone}
          </p>
        </div>
      </div>

      {/* Voting Deadline Section */}
      <div className="my-3 sm:my-4 pt-2 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("eventInfo.votingDeadline")}
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-6">
            {votingDeadline
              ? formatVotingDeadlineWallClock(votingDeadline)
              : t("eventInfo.noDeadline")}
          </p>
        </div>
      </div>
    </>
  );
}
