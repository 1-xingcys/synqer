"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { IoCopyOutline } from "react-icons/io5";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { getLiff } from "@/lib/liff";

interface Event {
  id: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
  timeZone: string;
}

interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  hasVoted: boolean;
  reminderSentAt?: string;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  lineGroupMember?: {
    displayName?: string;
    pictureUrl?: string;
  };
}

interface EventInfoProps {
  event: Event;
  expectedParticipants: ExpectedParticipant[];
}

export default function EventInfo({
  event,
  expectedParticipants,
}: EventInfoProps) {
  const t = useTranslations("event");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    const getShareUrl = async () => {
      const liff = await getLiff();
      if (liff && liff.isInClient()) {
        // 在 LIFF 環境中，使用 permanentLink 取得可分享的連結
        try {
          const permanentLink = liff.permanentLink.createUrl();
          setShareUrl(permanentLink);
        } catch {
          // 如果無法取得 permanentLink，使用當前 URL
          setShareUrl(window.location.href);
        }
      } else {
        setShareUrl(window.location.href);
      }
    };
    void getShareUrl();
  }, []);

  const handleCopyLink = () => {
    const urlToCopy = shareUrl || window.location.href;
    void navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (minuteOfDay: number) => {
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateLocale = locale === "zh-TW" ? "zh-TW" : "en-US";
    return date.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-2xl p-2 sm:p-8 mb-8 border border-gray-100 dark:border-zinc-800">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight leading-tight">
            {event.title || t("untitled")}
          </h1>
          {event.description && (
            <p className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              {event.description}
            </p>
          )}
        </div>

        <div className="shrink-0 pt-1">
          <Tooltip open={copied ? true : undefined}>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyLink}
                className="group flex items-center justify-center p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-zinc-200 transition-all duration-200"
                aria-label={t("copyLink")}
              >
                <IoCopyOutline className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={0}
              className={"text-white"}
            >
              {copied ? t("copied") : t("copyLink")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-100 dark:bg-zinc-800 my-6 sm:my-8" />

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {/* Date */}
        <div className="flex items-start gap-3 group">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 group-hover:bg-gray-100 dark:group-hover:bg-zinc-700 transition-colors">
            <svg
              className="w-5 h-5"
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
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
              {t("eventDate")}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
              {formatDate(event.startDate)}{" "}
              <span className="text-gray-300 dark:text-zinc-600 mx-1">/</span>{" "}
              {formatDate(event.endDate)}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3 group">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 group-hover:bg-gray-100 dark:group-hover:bg-zinc-700 transition-colors">
            <svg
              className="w-5 h-5"
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
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
              {t("timeRange")}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200 font-mono">
              {formatTime(event.startMinuteOfDay)} -{" "}
              {formatTime(event.endMinuteOfDay)}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-start gap-3 group">
          <div className="mt-0.5 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 group-hover:bg-gray-100 dark:group-hover:bg-zinc-700 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
              {t("participantCount")}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                {expectedParticipants.length} {t("participantUnit")}
              </p>
              {expectedParticipants.length > 0 && (
                <div className="flex -space-x-2 overflow-hidden">
                  {/* 簡單的頭像示意，增加視覺豐富度，但保持簡約 */}
                  {expectedParticipants.slice(0, 3).map((p) => {
                    const displayName =
                      p.user?.displayName ||
                      p.lineGroupMember?.displayName ||
                      "?";
                    return (
                      <div
                        key={p.id}
                        className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-300 font-bold"
                      >
                        {displayName[0]?.toUpperCase()}
                      </div>
                    );
                  })}
                  {expectedParticipants.length > 3 && (
                    <div className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] text-gray-400 dark:text-zinc-500 font-bold">
                      +{expectedParticipants.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
