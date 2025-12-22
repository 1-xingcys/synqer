"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { EventHeader } from "./EventHeader";
import { VotingProgress } from "@/components/ui/VotingProgress";

export default function HostedEventPanelPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { data, loading, error } = useHostedEventDetail(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">
          {error || t("event.notFound")}
        </p>
      </div>
    );
  }

  const { event, votingStats, expectedParticipants } = data;

  // 建立 userId -> pictureUrl 的映射
  const pictureUrlMap = new Map<string, string | undefined>();
  expectedParticipants.forEach((p) => {
    if (p.userId && p.pictureUrl) {
      pictureUrlMap.set(p.userId, p.pictureUrl);
    }
  });

  return (
    <div className="space-y-6">
      <EventHeader
        eventId={eventId}
        title={event.title}
        description={event.description}
        startDate={event.startDate}
        endDate={event.endDate}
        confirmedSlotIds={event.confirmedSlotIds}
        confirmedTimeRanges={event.confirmedTimeRanges}
        status={event.status}
      />

      <VotingProgress
        title={t("hosted.votingProgress")}
        votingPercentage={votingStats.votingPercentage}
        totalVoted={votingStats.totalVoted}
        totalExpected={votingStats.totalExpected}
      />
    </div>
  );
}
