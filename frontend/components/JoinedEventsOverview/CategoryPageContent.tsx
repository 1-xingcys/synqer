"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import { useFilteredAttendedEvents } from "@/hooks/useFilteredAttendedEvents";
import { EventListWithPagination } from "@/components/eventCommon/eventsOverview";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";
import { LoadingState } from "@/components/ui/loading-state";

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
      mode={EventRowMode.JOINED}
      translationNamespace="joinedEvents"
    />
  );
}
