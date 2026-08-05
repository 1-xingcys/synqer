"use client";

import { useTranslations } from "next-intl";
import { useMyEvents } from "@/hooks/useMyEvents";
import EventListWithPagination from "./EventListWithPagination";
import { LoadingState } from "@/components/ui/loading-state";
import { eventStatusForOverview, type OverviewStatus } from "@/lib/eventRoutes";

const TRANSLATION_NS = "joinedEvents";

export default function EventListPage({ status }: { status: OverviewStatus }) {
  const t = useTranslations(TRANSLATION_NS);
  const tOverview = useTranslations("unifiedEvents.overview");
  const { events, loading, error } = useMyEvents();
  const category = eventStatusForOverview(status);

  const filtered = events.filter((e) => e.status === category);

  // `loading` is only true on the very first fetch, so a failed *background*
  // refetch would otherwise replace a perfectly good list with an error — most
  // visibly on logout, where the refetch can only 401 once the cookie is gone.
  // Cached events stay on screen; the error is for when there is nothing else
  // to show.
  const showError = error !== null && events.length === 0;

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
      ) : showError ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <EventListWithPagination
          events={filtered}
          category={category}
          translationNamespace={TRANSLATION_NS}
        />
      )}
    </div>
  );
}
