"use client";

import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { EventStatusBadge } from "@/components/eventCommon/EventStatusBadge";
import { EventStatus } from "@/types/event";
import { useTranslations } from "next-intl";

interface EventHeaderProps {
  eventId: string;
  title?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  confirmedStartTime?: string | null;
  confirmedEndTime?: string | null;
  status: EventStatus;
}

export function EventHeader({
  eventId,
  title,
  description,
  startDate,
  endDate,
  confirmedStartTime,
  confirmedEndTime,
  status,
}: EventHeaderProps) {
  const t = useTranslations();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {title || t("event.untitled")}
            </h1>
            <EventStatusBadge status={status} />
          </div>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {format(new Date(startDate), "MMM d")} -{" "}
              {format(new Date(endDate), "MMM d, yyyy")}
            </span>
            {confirmedStartTime && confirmedEndTime && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {format(new Date(confirmedStartTime), "MMM d, HH:mm")} -{" "}
                {format(new Date(confirmedEndTime), "HH:mm")}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/joined/${eventId}`}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t("joined.viewEvent")}
        </Link>
      </div>
    </div>
  );
}
