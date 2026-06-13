"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { useMinuteNow } from "@/hooks/useMinuteNow";
import { getVotingDeadlineCountdownState } from "@/lib/event-presentation";

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
  const now = useMinuteNow();

  if (!votingDeadline) {
    return (
      <div className="h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
            {t("deadline.title")}
          </h2>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {t("deadline.notSet")}
        </p>
      </div>
    );
  }

  const countdown = getVotingDeadlineCountdownState(
    votingDeadline,
    now,
    isInactive,
  );
  const deadlineDate = countdown.deadlineDate!;
  const { isExpired, days, hours, minutes, isUrgent, isVeryCritical } =
    countdown;

  const getStatusColor = () => {
    if (isInactive || isExpired) return "text-zinc-500 dark:text-zinc-400";
    if (isVeryCritical) return "text-red-600 dark:text-red-400";
    if (isUrgent) return "text-amber-600 dark:text-amber-400";
    return "text-blue-600 dark:text-blue-400";
  };

  return (
    <div
      className={`h-full rounded-xl border p-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
          {t("deadline.title")}
        </h2>
        <span className="text-zinc-500 dark:text-zinc-400 text-xs">
          {format(deadlineDate, "M/d HH:mm")}
        </span>
      </div>

      {/* Countdown units */}
      <div className={`flex items-baseline gap-2 ${getStatusColor()}`}>
        <div className="text-center">
          <span className={`font-bold tabular-nums text-xl`}>
            {isExpired ? "00" : days.toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-medium ml-0.5">
            {t("deadline.days")}
          </span>
        </div>
        <div className="text-center">
          <span className={`font-bold tabular-nums text-xl`}>
            {isExpired ? "00" : hours.toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-medium ml-0.5">
            {t("deadline.hours")}
          </span>
        </div>
        <div className="text-center">
          <span className={`font-bold tabular-nums text-xl`}>
            {isExpired ? "00" : minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-medium ml-0.5">
            {t("deadline.minutes")}
          </span>
        </div>
      </div>
    </div>
  );
}
