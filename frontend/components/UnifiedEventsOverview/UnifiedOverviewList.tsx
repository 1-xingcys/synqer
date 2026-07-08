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
  const tOverview = useTranslations("unifiedEvents.overview");
  const { events, loading, error } = useMyEvents();
  const category = eventStatusForOverview(status);

  const filtered = events.filter((e) => e.status === category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {tOverview(`${status}.title`)}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {tOverview(`${status}.description`)}
        </p>
      </div>

      {loading ? (
        <LoadingState label={t("loading")} spinnerTone="neutral" />
      ) : error ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <EventListWithPagination
          events={filtered as (EventRowData | HostedEventRowData)[]}
          category={category}
          mode={EventRowMode.JOINED}
          translationNamespace={TRANSLATION_NS}
        />
      )}
    </div>
  );
}
