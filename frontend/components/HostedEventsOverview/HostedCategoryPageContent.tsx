"use client";

import { useTranslations } from "next-intl";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { useFilteredHostedEvents } from "@/hooks/useFilteredHostedEvents";
import { EventListWithPagination } from "@/components/eventCommon/eventsOverview";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";
import { LoadingState } from "@/components/ui/loading-state";

const TRANSLATION_NS = "hostedEvents";

interface HostedCategoryPageContentProps {
  category: EventStatus;
}

export default function HostedCategoryPageContent({
  category,
}: HostedCategoryPageContentProps) {
  const t = useTranslations(TRANSLATION_NS);
  const { events, loading, error } = useHostedEvents();
  const filteredEvents = useFilteredHostedEvents(events);

  if (loading) {
    return <LoadingState label={t("loading")} spinnerTone="neutral" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">{t("error")}</p>
      </div>
    );
  }

  const categoryEvents = filteredEvents[category];

  return (
    <EventListWithPagination
      events={categoryEvents}
      category={category}
      pageSize={10}
      mode={EventRowMode.HOSTED}
      translationNamespace={TRANSLATION_NS}
    />
  );
}
