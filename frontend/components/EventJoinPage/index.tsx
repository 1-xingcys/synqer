"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEventJoin } from "./useEventJoin";
import { ErrorView } from "./ErrorView";
import { JoinConfirmView } from "./JoinConfirmView";
import { DeletedEventView } from "@/components/eventCommon/DeletedEventView";
import { LoadingState } from "@/components/ui/loading-state";
import { useRouter } from "@/i18n/routing";
import { EventStatus } from "@/types/event";

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
          ? `/joined/${eventId}/vote`
          : `/joined/${eventId}`;
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
        backHref="/joined"
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
