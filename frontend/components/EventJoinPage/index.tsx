"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEventJoin } from "./useEventJoin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorView } from "./ErrorView";
import { JoinConfirmView } from "./JoinConfirmView";
import { DeletedEventView } from "@/components/eventCommon/DeletedEventView";
import { useRouter } from "@/i18n/routing";

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
      !eventInfo?.isDeleted &&
      participationStatus?.isParticipant
    ) {
      router.replace(`/joined/${eventId}`);
    }
  }, [
    eventId,
    eventInfo?.isDeleted,
    loading,
    participationStatus?.isParticipant,
    router,
  ]);

  if (loading) {
    return <LoadingSpinner />;
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
    return <LoadingSpinner />;
  }

  return (
    <JoinConfirmView
      eventInfo={eventInfo}
      joining={joining}
      onJoin={() => void handleJoin()}
    />
  );
}
