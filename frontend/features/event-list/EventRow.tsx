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
  CalendarCheck,
  ClockFading,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import { EventRowData } from "./types";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { formatEventDateRangeLabel } from "@/lib/event/event-presentation";
import { eventDetailPath } from "@/lib/routing/eventRoutes";
import { eventStatusColor } from "@/components/event/eventStatusStyles";

// Icon glyph per event status. Color comes from the shared eventStatusColor map
// so EventRow icons stay in sync with EventStatusText.
const statusIcon: Partial<Record<EventStatus, LucideIcon>> = {
  [EventStatus.VOTING_ENDED]: ClockFading,
  [EventStatus.CONFIRMED]: CalendarCheck,
  [EventStatus.COMPLETED]: CheckCheck,
};

interface EventRowProps {
  event: EventRowData;
  variant: EventStatus;
  translationNamespace?: string;
}

export default function EventRow({
  event,
  variant,
  translationNamespace = "joinedEvents",
}: EventRowProps) {
  const t = useTranslations(translationNamespace);
  const { copied, copyLink: handleCopyLink } = useEventShareLink(event.id);

  // 統一 detail 路由（role-aware）：投票中直接開投票分頁，其餘進活動主頁。
  const linkHref =
    event.status === EventStatus.VOTING
      ? eventDetailPath(event.id, "vote")
      : eventDetailPath(event.id);

  const hasVoted = event.hasVoted;

  // 邀請連結複製按鈕：統一清單以每列 isHost 判定。
  const canCopyInviteLink = Boolean(event.isHost);

  // Kept on "en-US" rather than the active locale, matching the label's prior
  // behaviour; localising it is a separate change.
  const formatDateRange = () =>
    formatEventDateRangeLabel(event.schedule, "en-US");

  const votedCount = event.votedCount ?? 0;
  const expectedCount = event.expectedParticipantCount;
  const host = event.host;
  const isHost = Boolean(event.isHost);

  // Render the status icon based on the viewer's role and variant
  const renderStatusIcon = () => {
    if (!isHost && variant === EventStatus.VOTING) {
      // For events the viewer joined, show personal vote status
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

    if (isHost && variant === EventStatus.VOTING) {
      // For events the viewer hosts, show voting progress indicator
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
    const Icon = statusIcon[variant];
    return Icon ? (
      <Icon className={`w-4 h-4 ${eventStatusColor[variant]}`} />
    ) : null;
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
          {/* Copy Link Button - only show for the host of the event */}
          {canCopyInviteLink && (
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

        {/* Host */}
        {host && (
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
              {/* Copy Link Button - only show for the host of the event */}
              {canCopyInviteLink && (
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
              {/* Host - always show the event creator */}
              {host && (
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
