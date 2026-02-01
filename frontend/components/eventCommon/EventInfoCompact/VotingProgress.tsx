"use client";

import { useTranslations } from "next-intl";

interface VotingProgressProps {
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
  /** 是否為非活躍狀態（confirmed/completed），進度條顯示灰色 */
  isInactive?: boolean;
}

export function VotingProgress({
  votingPercentage,
  totalVoted,
  totalExpected,
  isInactive = false,
}: VotingProgressProps) {
  const t = useTranslations();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
          {t("common.votingProgress")}
        </h2>
        <span className="font-medium text-zinc-600 dark:text-zinc-400 text-[10px]">
          {totalVoted} / {totalExpected}
        </span>
      </div>
      <div className="relative">
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden h-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isInactive ? "bg-zinc-400 dark:bg-zinc-500" : "bg-blue-500"}`}
            style={{ width: `${votingPercentage}%` }}
          />
        </div>
        <div className="mt-1 text-right">
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            {Math.round(votingPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
