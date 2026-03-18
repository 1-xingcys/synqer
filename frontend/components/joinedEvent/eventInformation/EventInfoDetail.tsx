"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { Calendar, Clock, Timer } from "lucide-react";
import { formatMinutesToTime } from "@/lib/utils";
import { EventStatusText } from "@/components/eventCommon/EventStatusText";
import { VoteStatusText } from "@/components/eventCommon/VoteStatusText";
import { EventSchedule, EventStatus, EventType, Weekday } from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";

interface EventInfoDetailProps {
  eventType: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  weekdays?: Weekday[];
  schedule?: EventSchedule;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  votingDeadline?: string | null;
  currentUserHasVoted: boolean;
}

export function EventInfoDetail({
  eventType,
  status,
  startDate,
  endDate,
  weekdays,
  schedule,
  startMinuteOfDay,
  endMinuteOfDay,
  votingDeadline,
  currentUserHasVoted,
}: EventInfoDetailProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRecurring = eventType === "RECURRING";
  const recurringWeekdays =
    weekdays ??
    (schedule?.kind === "RECURRING" ? schedule.weekdays : undefined);

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
            {isRecurring && recurringWeekdays?.length
              ? recurringWeekdays
                  .map((weekday) => formatWeekdayLabel(weekday, locale))
                  .join(", ")
              : [
                  format(new Date(startDate), "yyyy/MM/dd"),
                  format(new Date(endDate), "yyyy/MM/dd"),
                ].join(" ~ ")}
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
            {formatMinutesToTime(startMinuteOfDay)}
            <span className="mx-2 text-zinc-400">~</span>
            {formatMinutesToTime(endMinuteOfDay)}
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
              ? format(new Date(votingDeadline), "yyyy/MM/dd HH:mm")
              : t("eventInfo.noDeadline")}
          </p>
        </div>
      </div>
    </>
  );
}
