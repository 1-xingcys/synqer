"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttendedEventListItem } from "@/types/event";
import {
  Check,
  Clock,
  Copy,
  CheckCheck,
  Calendar,
  Users,
} from "lucide-react";
import { format } from "date-fns";

export interface EventRowHost {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface EventRowData extends AttendedEventListItem {
  host?: EventRowHost | null;
  expectedParticipantCount?: number;
  votedCount?: number;
}

interface EventRowProps {
  event: EventRowData;
  variant: "voting" | "votingEnded" | "confirmed" | "completed";
}

export default function EventRow({ event, variant }: EventRowProps) {
  const t = useTranslations("joinedEvents");
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format time range based on variant
  const getTimeRange = () => {
    if (variant === "confirmed" || variant === "completed") {
      if (event.confirmedStartTime && event.confirmedEndTime) {
        return {
          start: new Date(event.confirmedStartTime),
          end: new Date(event.confirmedEndTime),
        };
      }
    }
    return {
      start: new Date(event.startDate),
      end: new Date(event.endDate),
    };
  };

  const timeRange = getTimeRange();
  const formatDateRange = () => {
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
  const expectedCount = event.expectedParticipantCount ?? event.participantCount;

  return (
    <Link
      href={`/joined/${event.id}`}
      className="group block border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      {/* Desktop Layout - Single Row */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3">
        {/* Voting Status Icon */}
        <div className="w-6 shrink-0">
          {variant === "voting" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      event.hasVoted
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {event.hasVoted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {event.hasVoted ? t("voted") : t("notVoted")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {variant === "votingEnded" && (
            <Clock className="w-4 h-4 text-zinc-400" />
          )}
          {variant === "confirmed" && (
            <Calendar className="w-4 h-4 text-blue-500" />
          )}
          {variant === "completed" && (
            <CheckCheck className="w-4 h-4 text-emerald-500" />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {event.title || t("untitled")}
          </span>
        </div>

        {/* Copy Link Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? t("copied") : t("copyLink")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Host */}
        {event.host && (
          <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
            <Avatar className="w-5 h-5">
              {event.host.avatarUrl ? (
                <AvatarImage src={event.host.avatarUrl} alt={event.host.displayName || ""} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {(event.host.displayName || "?")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[80px]">
              {event.host.displayName || t("unknownHost")}
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
          <span>{votedCount} / {expectedCount}</span>
        </div>
      </div>

      {/* Mobile Layout - Compact Two Lines */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Voting Status Icon */}
          <div className="shrink-0 mt-0.5">
            {variant === "voting" && (
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  event.hasVoted
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                }`}
              >
                {event.hasVoted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </div>
            )}
            {variant === "votingEnded" && (
              <Clock className="w-4 h-4 text-zinc-400" />
            )}
            {variant === "confirmed" && (
              <Calendar className="w-4 h-4 text-blue-500" />
            )}
            {variant === "completed" && (
              <CheckCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {event.title || t("untitled")}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 h-6 w-6"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {/* Host */}
              {event.host && (
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    {event.host.avatarUrl ? (
                      <AvatarImage src={event.host.avatarUrl} alt={event.host.displayName || ""} />
                    ) : null}
                    <AvatarFallback className="text-[8px]">
                      {(event.host.displayName || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[60px]">
                    {event.host.displayName || t("unknownHost")}
                  </span>
                </div>
              )}

              {/* Date */}
              <span>{formatDateRange()}</span>

              {/* Vote Count */}
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{votedCount}/{expectedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

