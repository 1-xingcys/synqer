"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EventDetailNav, NavIcons } from "./event-detail-nav";
import { DeletedEventView } from "@/components/event/DeletedEventView";
import { BackButton } from "@/components/ui/BackButton";
import { EventDetailShellSkeleton } from "./EventDetailShellSkeleton";
import { ErrorView } from "@/features/event-join/ErrorView";
import { useAutoJoinEvent } from "@/features/event-join/useAutoJoinEvent";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuth } from "@/hooks/useAuth";
import { EventStatus } from "@/types/event";
import { Z_INDEX } from "@/lib/zIndex";
import { Crown } from "lucide-react";
import {
  eventDetailPath,
  eventOverviewPath,
  overviewStatusForEventStatus,
  type OverviewStatus,
} from "@/lib/eventRoutes";

/** overview 分類 → 側邊欄分類文案 key，供返回鍵顯示對應分類名稱。 */
const OVERVIEW_LABEL_KEY: Record<OverviewStatus, string> = {
  voting: "dashboard.voting",
  "voting-ended": "dashboard.votingEnded",
  confirmed: "dashboard.confirmed",
  completed: "dashboard.completed",
};

export function EventDetailContent({
  children,
  isHost,
}: {
  children: ReactNode;
  isHost: boolean;
}) {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;
  const { data, isLoading } = useEventDetail(eventId);
  const { user, loading: authLoading } = useAuth();

  // Resolved before the early returns below, because the auto-join hook cannot
  // be called conditionally.
  const isParticipant =
    data && user
      ? data.expectedParticipants.some(
          (p) =>
            p.userId === user.id.toString() ||
            p.user?.id === user.id.toString(),
        )
      : null;

  const { joinError, retryJoin } = useAutoJoinEvent(eventId, {
    isAuthenticated: !!user,
    isParticipant,
    eventExists: !!data,
    isDeleted: !!data?.isDeleted,
  });

  if (isLoading || authLoading) {
    return <EventDetailShellSkeleton />;
  }

  if (data?.isDeleted) {
    return (
      <DeletedEventView
        backHref={eventOverviewPath("voting")}
        backLabel={t("joined.backToJoined")}
        translationPrefix="joined"
      />
    );
  }

  if (!data || !user) {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        {t("event.notFound")}
      </div>
    );
  }

  // 非參與者：auto-join 正在進行，完成後 useEventDetail 失效重取，本分支自然消失。
  if (!isParticipant) {
    if (joinError) {
      return <ErrorView error={joinError} onRetry={retryJoin} />;
    }
    return <EventDetailShellSkeleton />;
  }

  const { event } = data;
  const isVoting = event.status === EventStatus.VOTING;

  // 返回鍵導向該活動所屬的分類 overview，並顯示對應分類文案。
  const overviewStatus = overviewStatusForEventStatus(event.status);
  const backHref = eventOverviewPath(overviewStatus);
  const backLabel = t("unifiedEvents.backToOverview", {
    category: t(OVERVIEW_LABEL_KEY[overviewStatus]),
  });

  const tabs = [
    {
      id: "overview",
      label: t("joined.tabs.overview"),
      href: eventDetailPath(eventId),
      icon: NavIcons.overview,
    },
    ...(isVoting
      ? [
          {
            id: "vote",
            label: t("joined.tabs.vote"),
            href: eventDetailPath(eventId, "vote"),
            icon: NavIcons.vote,
          },
        ]
      : []),
    {
      id: "results",
      label: t("joined.tabs.results"),
      href: eventDetailPath(eventId, "results"),
      icon: NavIcons.results,
    },
    ...(isHost
      ? [
          // TODO: participants tab entry is temporarily disabled; the page itself is kept for re-enabling later.
          {
            id: "settings",
            label: t("hosted.settings"),
            href: eventDetailPath(eventId, "settings"),
            icon: NavIcons.settings,
          },
        ]
      : []),
  ];

  return (
    <div className="py-4 sm:py-8 flex flex-col">
      <BackButton href={backHref} label={backLabel} />
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h1>
          {isHost && (
            <div
              className="p-1.5 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
              title={t("hosted.participantsPage.host")}
            >
              <span>{t("eventInfo.youAreHost")}</span>
              <Crown className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      <div
        className={`sticky overflow-x-auto top-0 ${Z_INDEX.NAV_STICKY} mt-5 bg-white/100 dark:bg-zinc-900/100 backdrop-blur supports-[backdrop-filter]:bg-white/100 dark:supports-[backdrop-filter]:bg-zinc-900/100`}
      >
        <EventDetailNav tabs={tabs} />
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}
