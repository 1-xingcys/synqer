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
  const t = useTranslations("hosted");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        {t("votingProgress")}
      </h2>
      <div className="flex items-center gap-6">
        <ProgressCircle percentage={votingPercentage} />
        <div className="flex-1 grid grid-cols-2 gap-4">
          <StatCard value={totalVoted} label={t("totalVoted")} />
          <StatCard value={totalExpected} label={t("totalExpected")} />
        </div>
      </div>
    </div>
  );
}

function ProgressCircle({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
