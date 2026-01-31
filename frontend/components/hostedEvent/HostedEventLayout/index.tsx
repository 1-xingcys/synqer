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
import {
  HostedEventProvider,
  useHostedEventContext,
} from "@/contexts/HostedEventContext";

interface HostedEventLayoutProps {
  children: ReactNode;
}

function HostedEventLayoutContent({ children }: HostedEventLayoutProps) {
  const params = useParams();
  const t = useTranslations("hosted");
  const tCommon = useTranslations("common");
  const eventId = params.eventId as string;
  const { data, loading, error } = useHostedEventContext();

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

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 dark:text-zinc-400">
              {tCommon("loading")}
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
        backHref="/hosted"
        backLabel={t("backToHosted")}
        translationPrefix="hosted"
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
              {error || t("eventNotFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { event } = data;

  return (
    <div className="py-4 sm:py-8 flex flex-col">
      {/* Back Button */}
      <BackButton href="/hosted" label={t("backToHosted")} />

      {/* Event Info Compact */}
      <div className="mt-5">
        <EventInfoCompact
          title={event.title}
          startDate={event.startDate}
          endDate={event.endDate}
          startMinuteOfDay={event.startMinuteOfDay}
          endMinuteOfDay={event.endMinuteOfDay}
          isHosted={true}
          eventId={eventId}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mt-3">
        <EventDetailNav tabs={tabs} />
      </div>

      {/* Page Content */}
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function HostedEventLayout({
  children,
}: HostedEventLayoutProps) {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <HostedEventProvider eventId={eventId}>
      <HostedEventLayoutContent>{children}</HostedEventLayoutContent>
    </HostedEventProvider>
  );
}
