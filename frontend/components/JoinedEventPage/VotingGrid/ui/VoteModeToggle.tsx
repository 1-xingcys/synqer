"use client";

import { useTranslations } from "next-intl";
import { VoteMode } from "../types";

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
    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
          {tJoined("voteModeLabel")}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Available mode button */}
          <button
            onClick={() => onModeChange("available")}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
              voteMode === "available"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                voteMode === "available"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
              }`}
            >
              <svg
                className="w-5 h-5"
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
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium ${
                  voteMode === "available"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-gray-700 dark:text-zinc-300"
                }`}
              >
                {tJoined("voteModeAvailable")}
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">
                {tJoined("voteModeAvailableDesc")}
              </div>
            </div>
            {voteMode === "available" && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* Unavailable mode button */}
          <button
            onClick={() => onModeChange("unavailable")}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
              voteMode === "unavailable"
                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                voteMode === "unavailable"
                  ? "bg-rose-500 text-white"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
              }`}
            >
              <svg
                className="w-5 h-5"
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
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium ${
                  voteMode === "unavailable"
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-gray-700 dark:text-zinc-300"
                }`}
              >
                {tJoined("voteModeUnavailable")}
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400">
                {tJoined("voteModeUnavailableDesc")}
              </div>
            </div>
            {voteMode === "unavailable" && (
              <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
