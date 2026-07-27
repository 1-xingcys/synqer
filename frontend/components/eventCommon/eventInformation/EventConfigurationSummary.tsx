"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Clock3, Globe, Timer, Calendar } from "lucide-react";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";
import { formatEventCandidateDaySummary } from "@/lib/event-presentation";
import { formatVotingDeadlineWallClock } from "@/lib/votingDeadline";
import { EventSchedule, EventType } from "@/types/event";
import type { WallClock } from "@/lib/time";

interface EventConfigurationSummaryProps {
  eventType: EventType;
  schedule: EventSchedule;
  timeZone: string;
  votingDeadline?: WallClock | null;
}

interface ConfigurationFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function ConfigurationField({ icon, label, value }: ConfigurationFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
        {icon}
        <span className="text-xs sm:text-sm font-medium">{label}</span>
      </div>
      <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-5 sm:pl-6">
        {value}
      </p>
    </div>
  );
}

/**
 * Read-only view of an event's configuration: the candidate days, the daily
 * time window, the time zone those wall-clock values belong to, and the voting
 * deadline. The editable counterpart is CreateEventForm/ConfigurationSection.
 */
export function EventConfigurationSummary({
  eventType,
  schedule,
  timeZone,
  votingDeadline,
}: EventConfigurationSummaryProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRecurring = eventType === "RECURRING";

  return (
    <>
      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3 sm:mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        {t("eventInfo.candidateInfo")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ConfigurationField
          icon={<CalendarDays className="w-4 h-4" />}
          label={
            isRecurring
              ? t("eventInfo.candidateWeekdays")
              : t("eventInfo.candidateDates")
          }
          value={formatEventCandidateDaySummary(
            { type: eventType, schedule },
            locale,
          )}
        />

        <ConfigurationField
          icon={<Clock3 className="w-4 h-4" />}
          label={t("eventInfo.candidateTime")}
          value={`${formatMinutesToTime(schedule.startMinuteOfDay)} ~ ${formatMinutesToTime(schedule.endMinuteOfDay)}`}
        />

        <ConfigurationField
          icon={<Globe className="w-4 h-4" />}
          label={t("eventInfo.timeZone")}
          value={timeZone}
        />

        <ConfigurationField
          icon={<Timer className="w-4 h-4" />}
          label={t("eventInfo.votingDeadline")}
          value={
            votingDeadline
              ? formatVotingDeadlineWallClock(votingDeadline)
              : t("eventInfo.noDeadline")
          }
        />
      </div>
    </>
  );
}
