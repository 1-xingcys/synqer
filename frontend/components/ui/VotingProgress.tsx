"use client";

import { useTranslations } from "next-intl";

interface VotingProgressProps {
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
}

export function VotingProgress({
  votingPercentage,
  totalVoted,
  totalExpected,
}: VotingProgressProps) {
  const t = useTranslations();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("common.votingProgress")}
          </h2>
          <span className="text-base font-semibold sm:hidden">
            {Math.round(votingPercentage)}%
          </span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {totalVoted} / {totalExpected}
        </span>
      </div>
      <div className="relative">
        <div className="w-full h-2.5 sm:h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${votingPercentage}%` }}
          />
        </div>
        <div className="hidden sm:block mt-2 text-right">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {Math.round(votingPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
