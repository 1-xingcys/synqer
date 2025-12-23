"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { EventStatusBadge } from "@/components/eventCommon/EventStatusBadge";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { EventStatus, ConfirmedTimeRange } from "@/types/event";
import DateRange from "./DateRange";
import ParticipantCount from "./ParticipantCount";
import VotingStatusBadge from "./VotingStatusBadge";
import ActionButton from "./ActionButton";

export interface EventCardProps {
  event: {
    id: string;
    title: string | null;
    description?: string | null;
    startDate: string;
    endDate: string;
    participantCount: number;
    status: EventStatus;
    confirmedSlotIds?: string[];
    confirmedTimeRanges?: ConfirmedTimeRange[];
    hasVoted?: boolean;
  };
  variant: "hosted" | "joined";
}

export default function EventCard({ event, variant }: EventCardProps) {
  const t = useTranslations();

  const href =
    variant === "hosted" ? `/hosted/${event.id}` : `/joined/${event.id}`;

  return (
    <Link
      href={href}
      className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.title || t("event.untitled")}
            </h3>
            <EventStatusBadge status={event.status} size="sm" />
          </div>
          {event.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            <DateRange startDate={event.startDate} endDate={event.endDate} />
            <ParticipantCount count={event.participantCount} />
            {event.confirmedTimeRanges &&
              event.confirmedTimeRanges.length > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <ConfirmedTimeDisplay
                    timeRanges={event.confirmedTimeRanges}
                    preview
                  />
                </span>
              )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {/* 投票狀態指示器 - 只在 joined 且 VOTING 狀態時顯示 */}
          {variant === "joined" &&
            event.status === EventStatus.VOTING &&
            event.hasVoted !== undefined && (
              <VotingStatusBadge hasVoted={event.hasVoted} />
            )}
          <ActionButton variant={variant} />
        </div>
      </div>
    </Link>
  );
}
