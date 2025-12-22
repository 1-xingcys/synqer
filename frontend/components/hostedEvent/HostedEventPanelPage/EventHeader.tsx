"use client";

import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { EventStatusBadge } from "@/components/eventCommon/EventStatusBadge";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { EventStatus, ConfirmedTimeRange } from "@/types/event";
import { useTranslations } from "next-intl";
import { debugLog } from "@/components/DebugConsole";
import { useEffect } from "react";

const log = (message: string, data?: unknown) =>
  debugLog("EventHeader", message, data);

interface EventHeaderProps {
  eventId: string;
  title?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  confirmedSlotIds: string[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  status: EventStatus;
}

export function EventHeader({
  eventId,
  title,
  description,
  startDate,
  endDate,
  confirmedSlotIds,
  confirmedTimeRanges,
  status,
}: EventHeaderProps) {
  const t = useTranslations();

  const hasConfirmedTime = confirmedSlotIds.length > 0;

  useEffect(() => {
    log("EventHeader", status);
  }, [status]);

  const renderActionButton = () => {
    switch (status) {
      case EventStatus.VOTING:
        // 投票中：顯示投票按鈕
        return (
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
        );
      case EventStatus.VOTING_ENDED:
        // 投票截止：根據是否已選擇時間顯示不同按鈕
        return (
          <Link
            href={`/hosted/${eventId}/confirm`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {hasConfirmedTime ? t("hosted.editTime") : t("hosted.decideTime")}
          </Link>
        );
      case EventStatus.CONFIRMED:
        // 已確認：顯示修改活動時間按鈕
        return (
          <Link
            href={`/hosted/${eventId}/confirm`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {t("hosted.editTime")}
          </Link>
        );
      case EventStatus.COMPLETED:
        // 已結束：不顯示按鈕
        return null;
      default:
        return null;
    }
  };

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
            {hasConfirmedTime && (
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <ConfirmedTimeDisplay
                  timeRanges={confirmedTimeRanges}
                  preview
                />
              </span>
            )}
          </div>
        </div>
        {renderActionButton()}
      </div>
    </div>
  );
}
