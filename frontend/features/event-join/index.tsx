"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEventJoin } from "./useEventJoin";
import { ErrorView } from "./ErrorView";
import { JoinConfirmView } from "./JoinConfirmView";
import { DeletedEventView } from "@/components/event/DeletedEventView";
import { LoadingState } from "@/components/ui/loading-state";
import { useRouter } from "@/i18n/routing";
import { EventStatus } from "@/types/event";
import { DEFAULT_OVERVIEW_PATH, eventDetailPath } from "@/lib/eventRoutes";

interface EventJoinPageProps {
  eventId: string;
}

export default function EventJoinPage({ eventId }: EventJoinPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const {
    eventInfo,
    participationStatus,
    loading,
    joining,
    error,
    handleJoin,
  } = useEventJoin(eventId);

  useEffect(() => {
    if (
      !loading &&
      eventInfo &&
      !eventInfo.isDeleted &&
      participationStatus?.isParticipant
    ) {
      const redirectPath =
        eventInfo.status === EventStatus.VOTING
          ? eventDetailPath(eventId, "vote")
          : eventDetailPath(eventId);
      router.replace(redirectPath);
    }
  }, [eventId, eventInfo, loading, participationStatus?.isParticipant, router]);

  if (loading) {
    return (
      <LoadingState
        label={t("common.loading")}
        viewport="section"
        textSize="base"
      />
    );
  }

  if (eventInfo?.isDeleted) {
    return (
      <DeletedEventView
        backHref={DEFAULT_OVERVIEW_PATH}
        backLabel={t("joined.backToJoined")}
        translationPrefix="eventJoin"
        showDashboardButton
      />
    );
  }

  if (error || !eventInfo) {
    return <ErrorView error={error} />;
  }

  if (participationStatus?.isParticipant) {
    return (
      <LoadingState
        label={t("common.loading")}
        viewport="section"
        textSize="base"
      />
    );
  }

  return (
    <JoinConfirmView
      eventInfo={eventInfo}
      joining={joining}
      onJoin={() => void handleJoin()}
    />
  );
}
