"use client";

import { useTranslations } from "next-intl";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventStatus } from "@/types/event";
import {
  Check,
  Clock,
  Copy,
  CheckCheck,
  Calendar,
  Users,
  Vote,
} from "lucide-react";
import { format } from "date-fns";
import { EventRowData, HostedEventRowData, EventRowMode } from "./types";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { getEventCandidateDateRange } from "@/lib/event-presentation";
import { formatWeekdayLabel } from "@/lib/weekdays";

interface EventRowProps {
  event: EventRowData | HostedEventRowData;
  variant: EventStatus;
  mode?: EventRowMode;
  translationNamespace?: string;
}

export default function EventRow({
  event,
  variant,
  mode = EventRowMode.JOINED,
  translationNamespace = "joinedEvents",
}: EventRowProps) {
  const t = useTranslations(translationNamespace);
  const { copied, copyLink: handleCopyLink } = useEventShareLink(event.id);

  const isJoined = mode === EventRowMode.JOINED;
  const isJoinedVoting = event.status === EventStatus.VOTING;
  const linkHref = isJoined
    ? isJoinedVoting
      ? `/joined/${event.id}/vote`
      : `/joined/${event.id}`
    : `/hosted/${event.id}`;

  // Check if hasVoted exists (for joined events)
  const hasVoted = "hasVoted" in event ? event.hasVoted : false;

  // Format time range based on variant
  const getTimeRange = () => {
    return getEventCandidateDateRange(event);
  };

  const timeRange = getTimeRange();
  const formatDateRange = () => {
    if (
      event.schedule?.kind === "RECURRING" &&
      event.schedule.weekdays?.length
    ) {
      return event.schedule.weekdays
        .map((weekday) => formatWeekdayLabel(weekday, "en-US"))
        .join(", ");
    }

    const start = format(timeRange.start, "MMM d");
    const end = format(timeRange.end, "MMM d, yyyy");
    const startYear = timeRange.start.getFullYear();
    const endYear = timeRange.end.getFullYear();

    if (startYear === endYear) {
      return `${start} - ${end}`;
    }
    return `${format(timeRange.start, "MMM d, yyyy")} - ${end}`;
  };

  const votedCount = event.votedCount ?? 0;
  const expectedCount = event.expectedParticipantCount;
  const host = "host" in event ? event.host : null;

  // Render the status icon based on mode and variant
  const renderStatusIcon = () => {
    if (isJoined && variant === EventStatus.VOTING) {
      // For joined voting events, show personal vote status
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  hasVoted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                }`}
              >
                {hasVoted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasVoted ? t("voted") : t("notVoted")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (!isJoined && variant === EventStatus.VOTING) {
      // For hosted voting events, show voting progress indicator
      const allVoted = votedCount >= expectedCount && expectedCount > 0;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  allVoted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}
              >
                {allVoted ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Vote className="w-3 h-3" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {allVoted ? t("allVoted") : t("votingInProgress")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // For other variants, show event status icon
    if (variant === EventStatus.VOTING_ENDED) {
      return <Clock className="w-4 h-4 text-zinc-400" />;
    }
    if (variant === EventStatus.CONFIRMED) {
      return <Calendar className="w-4 h-4 text-blue-500" />;
    }
    if (variant === EventStatus.COMPLETED) {
      return <CheckCheck className="w-4 h-4 text-emerald-500" />;
    }
    return null;
  };

  return (
    <TransitionLink
      href={linkHref}
      className="group block border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      direction="forward"
    >
      {/* Desktop Layout - Single Row */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3">
        {/* Status Icon */}
        <div className="w-6 shrink-0">{renderStatusIcon()}</div>

        {/* Title + Copy Link (hosted only) */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {event.title || t("untitled")}
          </span>
          {/* Copy Link Button - only show for hosted mode */}
          {!isJoined && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-70"
                onClick={(e) => void handleCopyLink(e)}
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              {copied && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                  {t("copied")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Host - only show for joined mode */}
        {isJoined && host && (
          <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Avatar className="w-5 h-5">
              {host.avatarUrl ? (
                <AvatarImage
                  src={host.avatarUrl}
                  alt={host.displayName || ""}
                />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {(host.displayName || "?")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[80px]">
              {host.displayName || t("unknownHost")}
            </span>
          </div>
        )}

        {/* Time Range */}
        <div className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0 min-w-[160px]">
          {formatDateRange()}
        </div>

        {/* Vote Count */}
        <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 shrink-0 min-w-[60px]">
          <Users className="w-4 h-4" />
          <span>
            {votedCount} / {expectedCount}
          </span>
        </div>
      </div>

      {/* Mobile Layout - Compact Two Lines */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">{renderStatusIcon()}</div>

          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {event.title || t("untitled")}
              </span>
              {/* Copy Link Button - only show for hosted mode */}
              {!isJoined && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    onClick={(e) => void handleCopyLink(e)}
                  >
                    {copied ? (
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  {copied && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                      {t("copied")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {/* Host - only show for joined mode */}
              {isJoined && host && (
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    {host.avatarUrl ? (
                      <AvatarImage
                        src={host.avatarUrl}
                        alt={host.displayName || ""}
                      />
                    ) : null}
                    <AvatarFallback className="text-[8px]">
                      {(host.displayName || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[60px]">
                    {host.displayName || t("unknownHost")}
                  </span>
                </div>
              )}

              {/* Date */}
              <span>{formatDateRange()}</span>

              {/* Vote Count */}
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>
                  {votedCount}/{expectedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransitionLink>
  );
}
