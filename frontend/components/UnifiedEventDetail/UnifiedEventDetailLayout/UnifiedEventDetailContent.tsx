"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EventDetailNav,
  NavIcons,
} from "@/components/eventCommon/EventDetailNav";
import { DeletedEventView } from "@/components/eventCommon/DeletedEventView";
import { BackButton } from "@/components/ui/BackButton";
import { LoadingState } from "@/components/ui/loading-state";
import EventJoinPage from "@/components/EventJoinPage";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { EventStatus } from "@/types/event";
import { Z_INDEX } from "@/lib/zIndex";
import { eventDetailPath, eventOverviewPath } from "@/lib/eventRoutes";

export function UnifiedEventDetailContent({
  children,
  isHost,
}: {
  children: ReactNode;
  isHost: boolean;
}) {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;
  const { data, isLoading } = useJoinedEventContext();
  const { user, loading: authLoading } = useAuthContext();

  if (isLoading || authLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
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

  const isParticipant = data.expectedParticipants.some(
    (p) => p.userId === user.id.toString() || p.user?.id === user.id.toString(),
  );

  // 非參與者：顯示 join UI（EventJoinPage 只在非參與者分支渲染，其內部 redirect 不會觸發）
  if (!isParticipant) {
    return <EventJoinPage eventId={eventId} />;
  }

  const { event } = data;
  const isVoting = event.status === EventStatus.VOTING;

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
          {
            id: "participants",
            label: t("hosted.participants"),
            href: eventDetailPath(eventId, "participants"),
            icon: NavIcons.participants,
          },
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
      <BackButton
        href={eventOverviewPath("voting")}
        label={t("joined.backToJoined")} // TODO: 改成返回活動清單，之後不會有清單不會以加入的活動為分類
      />
      <div className="mt-5">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h1>
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
