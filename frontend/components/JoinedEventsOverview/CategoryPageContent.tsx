"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import { useFilteredAttendedEvents } from "@/hooks/useFilteredAttendedEvents";
import { EventListWithPagination } from "@/components/eventCommon/eventsOverview";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";

interface CategoryPageContentProps {
  category: EventStatus;
}

export default function CategoryPageContent({
  category,
}: CategoryPageContentProps) {
  const t = useTranslations("joinedEvents");
  const { events, loading, error } = useAttendedEvents();
  const filteredEvents = useFilteredAttendedEvents(events);

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
      mode={EventRowMode.JOINED}
      translationNamespace="joinedEvents"
    />
  );
}
