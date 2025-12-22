"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { ParticipantStatus } from "@/types/event";
import { EventHeader } from "./EventHeader";
import { VotingProgress } from "./VotingProgress";
import {
  VotedParticipantList,
  PendingParticipantList,
} from "./ParticipantList";

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

  const { event, participants, votingStats, expectedParticipants } = data;

  // 建立 userId -> pictureUrl 的映射
  const pictureUrlMap = new Map<string, string | undefined>();
  expectedParticipants.forEach((p) => {
    if (p.userId && p.pictureUrl) {
      pictureUrlMap.set(p.userId, p.pictureUrl);
    }
  });

  // 將 pictureUrl 加入 votedParticipants
  const votedParticipants = participants
    .filter((p) => p.hasVoted)
    .map((p) => ({
      ...p,
      pictureUrl: pictureUrlMap.get(p.userId),
    }));

  const pendingParticipants = expectedParticipants.filter(
    (p) =>
      p.status === ParticipantStatus.NOT_VOTED ||
      p.status === ParticipantStatus.NOT_REGISTERED,
  );

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
        votingPercentage={votingStats.votingPercentage}
        totalVoted={votingStats.totalVoted}
        totalExpected={votingStats.totalExpected}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VotedParticipantList participants={votedParticipants} />
        <PendingParticipantList participants={pendingParticipants} />
      </div>
    </div>
  );
}
