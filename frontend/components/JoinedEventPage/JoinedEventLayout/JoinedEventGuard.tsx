"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { NotParticipantView } from "./NotParticipantView";

interface JoinedEventGuardProps {
  children: ReactNode;
}

export function JoinedEventGuard({ children }: JoinedEventGuardProps) {
  const t = useTranslations();
  const { data, loading } = useJoinedEventContext();
  const { user, loading: authLoading } = useAuthContext();

  const isLoading = loading || authLoading;

  // Check if user is an expected participant
  const isParticipant =
    data && user
      ? data.expectedParticipants.some(
          (p) =>
            p.userId === user.id.toString() ||
            p.user?.id === user.id.toString(),
        )
      : false;

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not a participant, show not participant view
  if (data && user && !isParticipant) {
    return (
      <NotParticipantView
        eventId={data.event.id}
        eventTitle={data.event.title}
      />
    );
  }

  return <>{children}</>;
}
