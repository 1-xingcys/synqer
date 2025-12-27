"use client";

import { useTranslations } from "next-intl";
import { VoteMode } from "@/types/event";

interface VoteModeToggleProps {
  voteMode: VoteMode;
  onModeChange: (mode: VoteMode) => void;
}

export function VoteModeToggle({
  voteMode,
  onModeChange,
}: VoteModeToggleProps) {
  const tJoined = useTranslations("joined");

  return (
    <div className="relative mb-5 sm:mb-0">
      {/* Toggle buttons */}
      <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
        <button
          onClick={() => onModeChange(VoteMode.AVAILABLE)}
          className={`w-12 h-8 sm:w-auto sm:h-auto flex items-center justify-center gap-1.5 sm:gap-2 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
            voteMode === VoteMode.AVAILABLE
              ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="hidden sm:inline">
            {tJoined("voteModeAvailable")}
          </span>
        </button>
        <button
          onClick={() => onModeChange(VoteMode.UNAVAILABLE)}
          className={`w-12 h-8 sm:w-auto sm:h-auto flex items-center justify-center gap-1.5 sm:gap-2 sm:px-3 sm:py-1.5 rounded-md text-sm font-medium transition-all ${
            voteMode === VoteMode.UNAVAILABLE
              ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="hidden sm:inline">
            {tJoined("voteModeUnavailable")}
          </span>
        </button>
      </div>

      {/* Mobile description text - absolute positioned */}
      <p className="sm:hidden absolute left-0 top-full text-xs whitespace-nowrap">
        {voteMode === VoteMode.AVAILABLE ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            {tJoined("voteModeAvailableDesc")}
          </span>
        ) : (
          <span className="text-rose-600 dark:text-rose-400">
            {tJoined("voteModeUnavailableDesc")}
          </span>
        )}
      </p>
    </div>
  );
}
