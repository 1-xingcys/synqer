"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EventDetailNav,
  NavIcons,
} from "@/components/eventCommon/EventDetailNav";
import { EventInfoCompact } from "@/components/eventCommon/EventInfoCompact";
import { DeletedEventView } from "@/components/eventCommon/DeletedEventView";
import { BackButton } from "@/components/ui/BackButton";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { EventStatus } from "@/types/event";

interface JoinedEventLayoutContentProps {
  children: ReactNode;
}

export function JoinedEventLayoutContent({
  children,
}: JoinedEventLayoutContentProps) {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;
  const { data, isLoading, error } = useJoinedEventContext();
  const { user } = useAuthContext();

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

  // 已刪除活動的 UI 提示
  if (data?.isDeleted) {
    return (
      <DeletedEventView
        backHref="/joined"
        backLabel={t("joined.backToJoined")}
        translationPrefix="joined"
      />
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

  // Determine event status
  const isVoting = event.status === EventStatus.VOTING;
  const isVotingEnded = event.status === EventStatus.VOTING_ENDED;
  const isConfirmed = event.status === EventStatus.CONFIRMED;

  // Get page hint based on status
  const getPageHint = () => {
    if (isVoting) {
      return {
        key: "voting",
        icon: (
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        ),
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-100 dark:border-blue-800/50",
        iconBg: "bg-blue-100 dark:bg-blue-800/50",
        titleColor: "text-blue-900 dark:text-blue-100",
        descColor: "text-blue-700 dark:text-blue-300",
      };
    }
    if (isVotingEnded) {
      return {
        key: "votingEnded",
        icon: (
          <svg
            className="w-4 h-4 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-100 dark:border-amber-800/50",
        iconBg: "bg-amber-100 dark:bg-amber-800/50",
        titleColor: "text-amber-900 dark:text-amber-100",
        descColor: "text-amber-700 dark:text-amber-300",
      };
    }
    if (isConfirmed) {
      return {
        key: "confirmed",
        icon: (
          <svg
            className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-100 dark:border-emerald-800/50",
        iconBg: "bg-emerald-100 dark:bg-emerald-800/50",
        titleColor: "text-emerald-900 dark:text-emerald-100",
        descColor: "text-emerald-700 dark:text-emerald-300",
      };
    }
    // Completed
    return {
      key: "completed",
      icon: (
        <svg
          className="w-4 h-4 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      bgColor: "bg-zinc-100 dark:bg-zinc-800/50",
      borderColor: "border-zinc-200 dark:border-zinc-700",
      iconBg: "bg-zinc-200 dark:bg-zinc-700",
      titleColor: "text-zinc-900 dark:text-zinc-100",
      descColor: "text-zinc-600 dark:text-zinc-400",
    };
  };

  const pageHint = getPageHint();

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

      {/* Page Hint */}
      <div
        className={`flex items-start gap-3 px-4 py-3 ${pageHint.bgColor} border ${pageHint.borderColor} rounded-xl`}
      >
        <div
          className={`w-8 h-8 rounded-lg ${pageHint.iconBg} flex items-center justify-center shrink-0`}
        >
          {pageHint.icon}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${pageHint.titleColor}`}>
            {t(`joined.pageHint.${pageHint.key}.title`)}
          </p>
          <p className={`text-xs ${pageHint.descColor} mt-0.5`}>
            {t(`joined.pageHint.${pageHint.key}.description`)}
          </p>
        </div>
      </div>

      {/* Event Info Compact */}
      <EventInfoCompact
        title={event.title}
        startDate={event.startDate}
        endDate={event.endDate}
        startMinuteOfDay={event.startMinuteOfDay}
        endMinuteOfDay={event.endMinuteOfDay}
        hasVoted={hasVoted}
      />

      {/* Navigation Tabs */}
      <EventDetailNav tabs={tabs} />

      {/* Page Content */}
      {children}
    </div>
  );
}
