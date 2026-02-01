"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isPast,
  format,
} from "date-fns";

interface DeadlineCountdownProps {
  votingDeadline?: string | null;
  /** 是否為非活躍狀態（confirmed/completed），倒數顯示灰色 */
  isInactive?: boolean;
}

export function DeadlineCountdown({
  votingDeadline,
  isInactive = false,
}: DeadlineCountdownProps) {
  const t = useTranslations("hosted");
  const [, setTick] = useState(0);

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!votingDeadline) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
            {t("deadline.title")}
          </h2>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
          {t("deadline.notSet")}
        </p>
      </div>
    );
  }

  const deadlineDate = new Date(votingDeadline);
  const now = new Date();
  const isExpired = isPast(deadlineDate);

  const days = differenceInDays(deadlineDate, now);
  const hours = differenceInHours(deadlineDate, now) % 24;
  const minutes = differenceInMinutes(deadlineDate, now) % 60;

  // Determine urgency level (disabled when inactive)
  const totalHours = differenceInHours(deadlineDate, now);
  const isUrgent = !isInactive && totalHours <= 24 && totalHours > 0;
  const isVeryCritical = !isInactive && totalHours <= 6 && totalHours > 0;

  const getStatusColor = () => {
    if (isInactive || isExpired) return "text-zinc-500 dark:text-zinc-400";
    if (isVeryCritical) return "text-red-600 dark:text-red-400";
    if (isUrgent) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  const getBgColor = () => {
    if (isInactive || isExpired) return "bg-zinc-100 dark:bg-zinc-800";
    if (isVeryCritical) return "bg-red-50 dark:bg-red-900/20";
    if (isUrgent) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-blue-50 dark:bg-blue-900/20";
  };

  const getBorderColor = () => {
    if (isInactive || isExpired) return "border-zinc-200 dark:border-zinc-700";
    if (isVeryCritical) return "border-red-200 dark:border-red-800";
    if (isUrgent) return "border-amber-200 dark:border-amber-800";
    return "border-blue-200 dark:border-blue-800";
  };

  return (
    <div
      className={`rounded-xl border p-3 ${getBgColor()} ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
          {t("deadline.title")}
        </h2>
        <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
          {format(deadlineDate, "M/d HH:mm")}
        </span>
      </div>

      {/* Countdown units */}
      <div className="flex items-baseline gap-2">
        <div className="text-center">
          <span
            className={`font-bold tabular-nums text-xl ${getStatusColor()}`}
          >
            {isExpired ? "00" : days.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[9px] ml-0.5">
            {t("deadline.days")}
          </span>
        </div>
        <div className="text-center">
          <span
            className={`font-bold tabular-nums text-xl ${getStatusColor()}`}
          >
            {isExpired ? "00" : hours.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[9px] ml-0.5">
            {t("deadline.hours")}
          </span>
        </div>
        <div className="text-center">
          <span
            className={`font-bold tabular-nums text-xl ${getStatusColor()}`}
          >
            {isExpired ? "00" : minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[9px] ml-0.5">
            {t("deadline.minutes")}
          </span>
        </div>
      </div>
    </div>
  );
}
