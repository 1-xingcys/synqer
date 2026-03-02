"use client";

import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { EventStatus } from "@/types/event";
import {
  ReadOnlyParticipants,
  LineGroupParticipants,
  DefaultParticipants,
} from "./containers";

export default function HostedEventParticipantsPage() {
  const t = useTranslations();
  const { data: eventData, isLoading: eventLoading } = useHostedEventContext();

  if (eventLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  if (!eventData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">{t("event.notFound")}</p>
      </div>
    );
  }

  // Check if voting is no longer allowed (vote ended, confirmed, complete)
  const isVotingDisabled =
    eventData.event.status === EventStatus.VOTING_ENDED ||
    eventData.event.status === EventStatus.CONFIRMED ||
    eventData.event.status === EventStatus.COMPLETED;

  // If voting is disabled, show read-only view
  if (isVotingDisabled) {
    return <ReadOnlyParticipants />;
  }

  // Determine mode based on event's lineGroupId
  const isLineGroupMode = !!eventData.event.lineGroupId;

  if (isLineGroupMode) {
    return <LineGroupParticipants />;
  }

  return <DefaultParticipants />;
}
