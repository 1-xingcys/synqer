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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
      className={`rounded-xl border p-6 ${getBgColor()} ${getBorderColor()}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("deadline.title")}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {format(deadlineDate, "M/d HH:mm")}
        </span>
      </div>

      {isExpired ? (
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-zinc-400 dark:text-zinc-500"
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
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">
            {t("deadline.expired")}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Countdown units */}
          <div className="flex items-baseline gap-4">
            {days > 0 && (
              <div className="text-center">
                <span
                  className={`text-3xl font-bold tabular-nums ${getStatusColor()}`}
                >
                  {days}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                  {t("deadline.days")}
                </span>
              </div>
            )}
            <div className="text-center">
              <span
                className={`text-3xl font-bold tabular-nums ${getStatusColor()}`}
              >
                {hours}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                {t("deadline.hours")}
              </span>
            </div>
            <div className="text-center">
              <span
                className={`text-3xl font-bold tabular-nums ${getStatusColor()}`}
              >
                {minutes}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                {t("deadline.minutes")}
              </span>
            </div>
          </div>

          {/* Urgency indicator */}
          {(isUrgent || isVeryCritical) && (
            <div className="ml-auto">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isVeryCritical
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
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

