"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import EmptyState from "./EmptyState";
import EventCard from "./EventCard";

export default function JoinedEventsOverview() {
  const t = useTranslations();
  const { events, loading, error } = useAttendedEvents();

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("dashboard.loadingEvents")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-red-600 dark:text-red-400">
            {t("dashboard.errorLoadingEvents")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("joined.title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t("joined.description")}
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
