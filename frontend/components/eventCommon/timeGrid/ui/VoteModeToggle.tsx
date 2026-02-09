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
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <button
          onClick={() => onModeChange(VoteMode.AVAILABLE)}
          className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
            voteMode === VoteMode.AVAILABLE
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900/70"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
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
          className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
            voteMode === VoteMode.UNAVAILABLE
              ? "bg-[#fff1f2] text-[#be123c] dark:bg-[#881337]/30 dark:text-[#fda4af]"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900/70"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
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
