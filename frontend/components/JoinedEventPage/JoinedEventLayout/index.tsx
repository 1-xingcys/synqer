"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EventDetailNav,
  NavIcons,
} from "@/components/eventCommon/EventDetailNav";
import { EventInfoCompact } from "@/components/eventCommon/EventInfoCompact";
import { BackButton } from "@/components/ui/BackButton";
import {
  JoinedEventProvider,
  useJoinedEventContext,
} from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { EventStatus } from "@/types/event";

interface JoinedEventLayoutProps {
  children: ReactNode;
}

function JoinedEventLayoutContent({ children }: JoinedEventLayoutProps) {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;
  const { data, loading, error } = useJoinedEventContext();
  const { user } = useAuthContext();

  if (loading) {
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

  if (error || !data) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400">
              {error || t("event.notFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { event, expectedParticipants } = data;

  // Check if current user has voted
  const hasVoted = user
    ? expectedParticipants.some(
        (p) =>
          (p.userId === user.id.toString() ||
            p.user?.id === user.id.toString()) &&
          p.hasVoted,
      )
    : false;

  // Determine if voting is active
  const isVoting = event.status === EventStatus.VOTING;

  // Generate tabs with dynamic overview label
  const tabs = [
    {
      id: "overview",
      label: isVoting ? t("joined.tabs.vote") : t("joined.tabs.overview"),
      href: `/joined/${eventId}`,
      icon: NavIcons.overview,
    },
    {
      id: "participants",
      label: t("joined.tabs.participants"),
      href: `/joined/${eventId}/participants`,
      icon: NavIcons.participants,
    },
    {
      id: "results",
      label: t("joined.tabs.results"),
      href: `/joined/${eventId}/results`,
      icon: NavIcons.results,
    },
  ];

  return (
    <div className="py-8 space-y-6">
      {/* Back Button */}
      <BackButton href="/joined" label={t("joined.backToJoined")} />

      {/* Event Info Compact */}
      <EventInfoCompact
        title={event.title}
        description={event.description}
        startDate={event.startDate}
        endDate={event.endDate}
        startMinuteOfDay={event.startMinuteOfDay}
        endMinuteOfDay={event.endMinuteOfDay}
        status={event.status}
        hasVoted={hasVoted}
        confirmedTimeRanges={event.confirmedTimeRanges}
        votingDeadline={event.votingDeadline}
      />

      {/* Navigation Tabs */}
      <EventDetailNav tabs={tabs} />

      {/* Page Content */}
      {children}
    </div>
  );
}

export default function JoinedEventLayout({
  children,
}: JoinedEventLayoutProps) {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <JoinedEventProvider eventId={eventId}>
      <JoinedEventLayoutContent>{children}</JoinedEventLayoutContent>
    </JoinedEventProvider>
  );
}
