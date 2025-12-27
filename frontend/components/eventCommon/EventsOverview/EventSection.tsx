"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import EventRow from "./EventRow";
import { EventRowData, HostedEventRowData } from "./types";
import { ChevronRight } from "lucide-react";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "./types";

interface EventSectionProps {
  title: string;
  events: (EventRowData | HostedEventRowData)[];
  category: EventStatus;
  showViewMore?: boolean;
  viewMoreHref?: string;
  limit?: number;
  mode?: EventRowMode;
  translationNamespace?: string;
}

export default function EventSection({
  title,
  events,
  category,
  showViewMore = false,
  viewMoreHref,
  limit,
  mode = EventRowMode.JOINED,
  translationNamespace = "joinedEvents",
}: EventSectionProps) {
  const t = useTranslations(translationNamespace);

  const displayEvents = limit ? events.slice(0, limit) : events;
  const hasMore = limit ? events.length > limit : false;

  if (events.length === 0) {
    return null;
  }

  const categoryTitles: Record<EventStatus, string> = {
    [EventStatus.VOTING]: t("tabs.voting"),
    [EventStatus.VOTING_ENDED]: t("tabs.votingEnded"),
    [EventStatus.CONFIRMED]: t("tabs.confirmed"),
    [EventStatus.COMPLETED]: t("tabs.completed"),
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
      </div>

      {/* Events List */}
      <div>
        {displayEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            variant={category}
            mode={mode}
            translationNamespace={translationNamespace}
          />
        ))}
      </div>

      {/* View More Link */}
      {showViewMore && hasMore && viewMoreHref && (
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <Link
            href={viewMoreHref}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {t("viewMore", { type: categoryTitles[category] })}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
