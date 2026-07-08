"use client";

import { useTranslations } from "next-intl";
import { useMyEvents } from "@/hooks/useMyEvents";
import { EventListWithPagination } from "@/components/eventCommon/eventsOverview";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";
import type {
  EventRowData,
  HostedEventRowData,
} from "@/components/eventCommon/eventsOverview/types";
import { LoadingState } from "@/components/ui/loading-state";
import { eventStatusForOverview, type OverviewStatus } from "@/lib/eventRoutes";

const TRANSLATION_NS = "joinedEvents";

export default function UnifiedOverviewList({
  status,
}: {
  status: OverviewStatus;
}) {
  const t = useTranslations(TRANSLATION_NS);
  const { events, loading, error } = useMyEvents();
  const category = eventStatusForOverview(status);

  if (loading) {
    return <LoadingState label={t("loading")} spinnerTone="neutral" />;
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const filtered = events.filter((e) => e.status === category);

  return (
    <EventListWithPagination
      events={filtered as (EventRowData | HostedEventRowData)[]}
      category={category}
      mode={EventRowMode.JOINED}
      translationNamespace={TRANSLATION_NS}
    />
  );
}
