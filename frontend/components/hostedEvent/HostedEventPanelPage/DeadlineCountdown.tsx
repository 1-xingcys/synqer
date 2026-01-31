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
import { Clock, AlertTriangle } from "lucide-react";

interface DeadlineCountdownProps {
  votingDeadline?: string | null;
}

export function DeadlineCountdown({ votingDeadline }: DeadlineCountdownProps) {
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("deadline.title")}
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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

  // Determine urgency level
  const totalHours = differenceInHours(deadlineDate, now);
  const isUrgent = totalHours <= 24 && totalHours > 0;
  const isVeryCritical = totalHours <= 6 && totalHours > 0;

  const getStatusColor = () => {
    if (isExpired) return "text-zinc-500 dark:text-zinc-400";
    if (isVeryCritical) return "text-red-600 dark:text-red-400";
    if (isUrgent) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  const getBgColor = () => {
    if (isExpired) return "bg-zinc-100 dark:bg-zinc-800";
    if (isVeryCritical) return "bg-red-50 dark:bg-red-900/20";
    if (isUrgent) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-blue-50 dark:bg-blue-900/20";
  };

  const getBorderColor = () => {
    if (isExpired) return "border-zinc-200 dark:border-zinc-700";
    if (isVeryCritical) return "border-red-200 dark:border-red-800";
    if (isUrgent) return "border-amber-200 dark:border-amber-800";
    return "border-blue-200 dark:border-blue-800";
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-6 ${getBgColor()} ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("deadline.title")}
          </h2>
          {/* Mobile: Show urgency badge inline with title */}
          {(isUrgent || isVeryCritical) && !isExpired && (
            <span
              className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isVeryCritical
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {isVeryCritical ? t("deadline.urgent") : t("deadline.endingSoon")}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {format(deadlineDate, "M/d HH:mm")}
        </span>
      </div>

      {isExpired ? (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium">
            {t("deadline.expired")}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Countdown units */}
          <div className="flex items-baseline gap-3 sm:gap-4">
            {days > 0 && (
              <div className="text-center">
                <span
                  className={`text-2xl sm:text-3xl font-bold tabular-nums ${getStatusColor()}`}
                >
                  {days}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-0.5 sm:ml-1">
                  {t("deadline.days")}
                </span>
              </div>
            )}
            <div className="text-center">
              <span
                className={`text-2xl sm:text-3xl font-bold tabular-nums ${getStatusColor()}`}
              >
                {hours}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-0.5 sm:ml-1">
                {t("deadline.hours")}
              </span>
            </div>
            <div className="text-center">
              <span
                className={`text-2xl sm:text-3xl font-bold tabular-nums ${getStatusColor()}`}
              >
                {minutes}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-0.5 sm:ml-1">
                {t("deadline.minutes")}
              </span>
            </div>
          </div>

          {/* Desktop: Urgency indicator on the right */}
          {(isUrgent || isVeryCritical) && (
            <div className="hidden sm:block">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isVeryCritical
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {isVeryCritical
                  ? t("deadline.urgent")
                  : t("deadline.endingSoon")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
