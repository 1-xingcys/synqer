"use client";

interface VotingProgressProps {
  title?: string;
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
}

export function VotingProgress({
  title = "Voting Progress",
  votingPercentage,
  totalVoted,
  totalExpected,
}: VotingProgressProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {totalVoted} / {totalExpected}
        </span>
      </div>
      <div className="relative">
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${votingPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-right">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {Math.round(votingPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
