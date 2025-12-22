"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  EventDetailNav,
  NavIcons,
} from "@/components/eventCommon/EventDetailNav";

interface HostedEventLayoutProps {
  children: ReactNode;
}

export default function HostedEventLayout({
  children,
}: HostedEventLayoutProps) {
  const params = useParams();
  const t = useTranslations("hosted");
  const eventId = params.eventId as string;

  const tabs = [
    {
      id: "overview",
      label: t("overview"),
      href: `/hosted/${eventId}`,
      icon: NavIcons.overview,
    },
    {
      id: "participants",
      label: t("participants"),
      href: `/hosted/${eventId}/participants`,
      icon: NavIcons.participants,
    },
    {
      id: "settings",
      label: t("settings"),
      href: `/hosted/${eventId}/settings`,
      icon: NavIcons.settings,
    },
  ];

  return (
    <div className="py-8 space-y-6">
      <EventDetailNav
        tabs={tabs}
        backHref="/hosted"
        backLabel={t("backToHosted")}
      />
      {children}
    </div>
  );
}
