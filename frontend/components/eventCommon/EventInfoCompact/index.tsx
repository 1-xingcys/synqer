"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Link } from "@/i18n/routing";
import {
  ExternalLink,
  Copy,
  CheckCheck,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { formatMinutesToTime } from "@/lib/utils";

interface EventInfoCompactProps {
  title?: string | null;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  hasVoted?: boolean;
  /** 是否為 hosted 頁面（不顯示 Status Description，顯示前往按鈕） */
  isHosted?: boolean;
  eventId?: string;
}

export function EventInfoCompact({
  title,
  startDate,
  endDate,
  startMinuteOfDay,
  endMinuteOfDay,
  hasVoted,
  isHosted = false,
  eventId,
}: EventInfoCompactProps) {
  const t = useTranslations();
  const { copied, copyLink: handleCopyLink } = useEventShareLink(eventId || "");

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      {/* 1. Header Section: Title & Status Badge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight wrap-break-words">
            {title || t("event.untitled")}
          </h1>
          {/* Joined Mode: Voted Status Badge (Top Right) */}
          {hasVoted !== undefined && (
            <div className="shrink-0 pt-1.5">
              {hasVoted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t("joined.voted")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t("joined.notVoted")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Info Cards: Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date Card */}
        <div className="flex flex-col p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 mb-0.5 text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {t("event.eventDate")}
            </span>
          </div>
          <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {format(new Date(startDate), "M/d")} -{" "}
            {format(new Date(endDate), "M/d")}
          </span>
        </div>

        {/* Time Card */}
        <div className="flex flex-col p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 mb-0.5 text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {t("event.time")}
            </span>
          </div>
          <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
            {formatMinutesToTime(startMinuteOfDay)} -{" "}
            {formatMinutesToTime(endMinuteOfDay)}
          </span>
        </div>
      </div>

      {/* 3. Action Buttons (Only for Hosted Mode) */}
      {isHosted && eventId && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
          <button
            onClick={() => void handleCopyLink()}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-all active:scale-[0.98]"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {t("eventInfo.copyVoteLink")}
          </button>

          <Link
            href={`/joined/${eventId}`}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-sm transition-all active:scale-[0.98] shadow-sm shadow-blue-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            {t("eventInfo.goToVotePage")}
          </Link>
        </div>
      )}
    </div>
  );
}
