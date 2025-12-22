"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EventDetailNav,
  NavIcons,
} from "@/components/eventCommon/EventDetailNav";

interface JoinedEventLayoutProps {
  children: ReactNode;
}

export default function JoinedEventLayout({
  children,
}: JoinedEventLayoutProps) {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;

  const tabs = [
    {
      id: "overview",
      label: t("joined.tabs.overview"),
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
      <EventDetailNav
        tabs={tabs}
        backHref="/joined"
        backLabel={t("joined.backToJoined")}
      />
      {children}
    </div>
  );
}


