"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Link } from "@/i18n/routing";
import { TransitionLink } from "@/components/ui/TransitionLink";
import {
  ExternalLink,
  Copy,
  CheckCheck,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { formatMinutesToTime } from "@/lib/utils";
import { EventStatus } from "@/types/event";
import { EventStatusText } from "@/components/eventCommon/EventStatusText";
import { VoteStatusText } from "@/components/eventCommon/VoteStatusText";
import { VotingStatusBar } from "./VotingStatusBar";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { VotingProgress } from "./VotingProgress";

interface VotingStatusProps {
  votingDeadline?: string | null;
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
  /** 是否為非投票階段（confirmed/completed），倒數會顯示灰色 */
  isInactive?: boolean;
}

interface EventInfoCompactProps {
  title?: string | null;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  hasVoted?: boolean;
  /** 是否為 hosted 頁面（不顯示 Status Description，顯示前往按鈕） */
  isHosted?: boolean;
  eventId: string;
  eventStatus?: EventStatus;
  votingStatus?: VotingStatusProps;
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
  eventStatus,
  votingStatus,
}: EventInfoCompactProps) {
  const t = useTranslations();
  const { copied, copyLink: handleCopyLink } = useEventShareLink(eventId || "");

  const showActions = isHosted && eventId;

  // ========== Pre-render: Meta Row Content ==========
  const metaRowContent = (
    <>
      {eventStatus && (
        <>
          <EventStatusText status={eventStatus} />
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
        </>
      )}
      <div className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
        <span className="font-mono">
          {format(new Date(startDate), "M/d")} ~{" "}
          {format(new Date(endDate), "M/d")}
        </span>
      </div>
      <span className="text-zinc-300 dark:text-zinc-600">•</span>
      <div className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
        <span className="font-mono">
          {formatMinutesToTime(startMinuteOfDay)} ~{" "}
          {formatMinutesToTime(endMinuteOfDay)}
        </span>
      </div>
    </>
  );

  const metaRow = !isHosted ? (
    <TransitionLink
      href={`/joined/info/${eventId}/`}
      className="group flex flex-wrap items-center gap-x-1 sm:gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 decoration-zinc-400 dark:decoration-zinc-500 underline-offset-2 transition-all"
    >
      {metaRowContent}
      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors ml-0.5" />
    </TransitionLink>
  ) : (
    <div className="flex flex-wrap items-center gap-x-1 sm:gap-x-2 gap-y-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
      {metaRowContent}
    </div>
  );

  const copyLinkButton = (size: "sm" | "lg") => (
    <button
      onClick={() => void handleCopyLink()}
      className={`flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm transition-all active:scale-[0.98] ${
        size === "sm" ? "flex-1 px-4 py-2" : "px-5 py-2.5 w-full"
      }`}
    >
      {copied ? (
        <CheckCheck className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      <span className="whitespace-nowrap">{t("eventInfo.copyVoteLink")}</span>
    </button>
  );

  const goToVoteButton = (size: "sm" | "lg") => (
    <Link
      href={`/joined/${eventId}`}
      className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-sm transition-all active:scale-[0.98] shadow-sm shadow-blue-500/20 ${
        size === "sm" ? "flex-1 px-4 py-2" : "px-5 py-2.5 w-full"
      }`}
    >
      <ExternalLink className="w-4 h-4" />
      <span className="whitespace-nowrap">{t("eventInfo.goToVotePage")}</span>
    </Link>
  );

  const mobileActions = (
    <div className="flex flex-col gap-4 sm:hidden">
      <div className="flex flex-row gap-3 w-full">
        {copyLinkButton("sm")}
        {goToVoteButton("sm")}
      </div>
      {votingStatus && (
        <VotingStatusBar
          votingDeadline={votingStatus.votingDeadline}
          votingPercentage={votingStatus.votingPercentage}
          totalVoted={votingStatus.totalVoted}
          totalExpected={votingStatus.totalExpected}
          isInactive={votingStatus.isInactive}
        />
      )}
    </div>
  );

  const desktopActions = (
    <div className="hidden sm:flex sm:flex-row sm:items-stretch sm:gap-4">
      {votingStatus && (
        <div className="flex-1 min-w-[200px]">
          <DeadlineCountdown
            votingDeadline={votingStatus.votingDeadline}
            isInactive={votingStatus.isInactive}
          />
        </div>
      )}
      {votingStatus && (
        <div className="flex-1 min-w-[200px]">
          <VotingProgress
            votingPercentage={votingStatus.votingPercentage}
            totalVoted={votingStatus.totalVoted}
            totalExpected={votingStatus.totalExpected}
            isInactive={votingStatus.isInactive}
          />
        </div>
      )}
      <div className="flex flex-col justify-center gap-2 shrink-0 ml-auto min-w-[140px]">
        {goToVoteButton("lg")}
        {copyLinkButton("lg")}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Title & Meta Info */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight">
            {title || t("event.untitled")}
          </h1>
          {hasVoted !== undefined && (
            <div className="shrink-0 pt-1">
              <VoteStatusText hasVoted={hasVoted} />
            </div>
          )}
        </div>

        {/* Meta Row */}
        {metaRow}
      </div>

      {/* Actions & Voting Status */}
      {showActions && (
        <>
          {mobileActions}
          {desktopActions}
        </>
      )}
    </div>
  );
}
