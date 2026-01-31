"use client";

import { useTranslations } from "next-intl";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isPast,
} from "date-fns";
import { Clock, AlertTriangle, Users } from "lucide-react";

interface VotingStatusBarProps {
  votingDeadline?: string | null;
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
}

/**
手機版使用的 UI，有截止日期倒數和投票進度
 */
export function VotingStatusBar({
  votingDeadline,
  votingPercentage,
  totalVoted,
  totalExpected,
}: VotingStatusBarProps) {
  const t = useTranslations();

  // Calculate deadline countdown
  const deadlineDate = votingDeadline ? new Date(votingDeadline) : null;
  const now = new Date();
  const isExpired = deadlineDate ? isPast(deadlineDate) : false;

  const days = deadlineDate ? differenceInDays(deadlineDate, now) : 0;
  const hours = deadlineDate ? differenceInHours(deadlineDate, now) % 24 : 0;
  const minutes = deadlineDate
    ? differenceInMinutes(deadlineDate, now) % 60
    : 0;

  // Determine urgency level
  const totalHours = deadlineDate ? differenceInHours(deadlineDate, now) : 0;
  const isUrgent = totalHours <= 24 && totalHours > 0;
  const isVeryCritical = totalHours <= 6 && totalHours > 0;

  const getTimeColor = () => {
    if (isExpired || !deadlineDate) return "text-zinc-500 dark:text-zinc-400";
    if (isVeryCritical) return "text-red-600 dark:text-red-400";
    if (isUrgent) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  const getUrgencyIcon = () => {
    if ((isUrgent || isVeryCritical) && !isExpired) {
      return (
        <AlertTriangle
          className={`w-3.5 h-3.5 ${isVeryCritical ? "text-red-500" : "text-amber-500"}`}
        />
      );
    }
    return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
  };

  // Format countdown string
  const getCountdownContent = () => {
    if (!deadlineDate)
      return (
        <span className="text-zinc-400 text-sm">
          {t("hosted.deadline.notSet")}
        </span>
      );
    if (isExpired)
      return (
        <span className="text-zinc-500 font-medium text-sm">
          {t("hosted.deadline.expired")}
        </span>
      );

    return (
      <div className={`flex items-baseline gap-1 ${getTimeColor()}`}>
        {days > 0 && (
          <>
            <span className="text-xl font-bold tabular-nums">{days}</span>
            <span className="text-xs font-medium mr-1">
              {t("hosted.deadline.days")}
            </span>
          </>
        )}
        <span className="text-xl font-bold tabular-nums">{hours}</span>
        <span className="text-xs font-medium mr-1">
          {t("hosted.deadline.hours")}
        </span>
        <span className="text-xl font-bold tabular-nums">{minutes}</span>
        <span className="text-xs font-medium">
          {t("hosted.deadline.minutes")}
        </span>
      </div>
    );
  };

  // Circular Progress
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (votingPercentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Deadline Countdown */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1 text-zinc-500 dark:text-zinc-400">
            {getUrgencyIcon()}
            <span className="text-xs font-medium tracking-wide uppercase">
              {t("hosted.deadline.title")}
            </span>
          </div>
          <div>{getCountdownContent()}</div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800" />

        {/* Right: Circular Progress */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-zinc-100 dark:text-zinc-800"
              />
              {/* Progress Circle */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Percentage Text */}
            <span className="absolute text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
              {Math.round(votingPercentage)}%
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
              {t("common.votingProgress")}
            </span>
            <div className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-sm font-semibold">
                {totalVoted}/{totalExpected}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
