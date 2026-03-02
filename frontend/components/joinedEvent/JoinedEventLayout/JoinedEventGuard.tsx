"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { NotParticipantView } from "./NotParticipantView";

interface JoinedEventGuardProps {
  children: ReactNode;
}

export function JoinedEventGuard({ children }: JoinedEventGuardProps) {
  const t = useTranslations();
  const { data, isLoading: eventLoading } = useJoinedEventContext();
  const { user, loading: authLoading } = useAuthContext();

  const isLoading = eventLoading || authLoading;

  // Show loading while checking
  if (isLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  // 已刪除活動直接放行，讓 JoinedEventLayoutContent 處理顯示
  if (data?.isDeleted) {
    return <>{children}</>;
  }

  // Check if user is an expected participant
  const isParticipant =
    data && user
      ? data.expectedParticipants.some(
          (p) =>
            p.userId === user.id.toString() ||
            p.user?.id === user.id.toString(),
        )
      : false;

  // If not a participant, show not participant view
  if (data && user && !isParticipant) {
    return (
      <NotParticipantView
        eventId={data.event.id}
        eventTitle={data.event.title ?? undefined}
      />
    );
  }

  return <>{children}</>;
}
