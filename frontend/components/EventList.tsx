"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

interface Event {
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  participantCount: number;
}

interface EventListProps {
  events: Event[];
  loading: boolean;
  error: string | null;
}

export default function EventList({ events, loading, error }: EventListProps) {
  const t = useTranslations();
  const router = useRouter();

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("dashboard.loadingEvents")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">
          {t("dashboard.errorLoadingEvents")}
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          {t("dashboard.noEvents")}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("dashboard.noEventsDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push(`/events/${event.id}`)}
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {event.title || t("dashboard.noEvents")}
          </h3>
          {event.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-500">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {new Date(event.startDate).toLocaleDateString()} -{" "}
                {new Date(event.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>
                {t("dashboard.participants", { count: event.participantCount })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
