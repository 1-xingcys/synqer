"use client";

import { useTranslations } from "next-intl";
import { EventStatusText } from "@/components/eventCommon/EventStatusText";
import { VoteStatusText } from "@/components/eventCommon/VoteStatusText";
import { EventConfigurationSummary } from "@/components/eventCommon/eventInformation/EventConfigurationSummary";
import { EventSchedule, EventStatus, EventType } from "@/types/event";

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-4">
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

      <EventConfigurationSummary
        eventType={eventType}
        schedule={schedule}
        timeZone={timeZone}
        votingDeadline={votingDeadline}
      />
    </>
  );
}
