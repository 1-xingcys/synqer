"use client";

import { useTranslations } from "next-intl";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { useFilteredHostedEvents } from "@/hooks/useFilteredHostedEvents";
import {
  EventListWithPagination,
  EventCategory,
} from "@/components/eventCommon/EventsOverview";

const TRANSLATION_NS = "hostedEvents";

interface HostedCategoryPageContentProps {
  category: EventCategory;
}

export default function HostedCategoryPageContent({
  category,
}: HostedCategoryPageContentProps) {
  const t = useTranslations(TRANSLATION_NS);
  const { events, loading, error } = useHostedEvents();
  const filteredEvents = useFilteredHostedEvents(events);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
        </div>
      </div>
    );
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
      mode="hosted"
      translationNamespace={TRANSLATION_NS}
    />
  );
}
