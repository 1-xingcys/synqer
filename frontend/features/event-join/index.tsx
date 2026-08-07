"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEventJoin } from "./useEventJoin";
import { postJoinRedirectPath } from "./autoJoin";
import { ErrorView } from "./ErrorView";
import { DeletedEventView } from "@/components/event/DeletedEventView";
import { LoadingState } from "@/components/ui/loading-state";
import { useRouter } from "@/i18n/routing";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";

interface EventJoinPageProps {
  eventId: string;
}

/**
 * Landing page for a bare event link, which is where the shared LINE flex
 * button points. Nobody is asked to confirm anything: a stranger is enrolled
 * on arrival and forwarded to the tab the link promised.
 */
export default function EventJoinPage({ eventId }: EventJoinPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { eventInfo, isParticipant, loading, error, joinError, retryJoin } =
    useEventJoin(eventId);

  useEffect(() => {
    if (!eventInfo || eventInfo.isDeleted || !isParticipant) return;
    router.replace(postJoinRedirectPath(eventId, eventInfo.status));
  }, [eventId, eventInfo, isParticipant, router]);

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

  if (joinError) {
    return <ErrorView error={joinError} onRetry={retryJoin} />;
  }

  // Joining, or the redirect that follows it, is in flight.
  return (
    <LoadingState
      label={t("common.loading")}
      viewport="section"
      textSize="base"
    />
  );
}
