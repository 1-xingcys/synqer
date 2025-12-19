"use client";

import { useTranslations } from "next-intl";
import { VoteMode } from "../types";

interface VotingHeaderProps {
  voteMode: VoteMode;
  hasSubmittedVote: boolean;
  saving: boolean;
  onSave: () => void;
}

export function VotingHeader({
  voteMode,
  hasSubmittedVote,
  saving,
  onSave,
}: VotingHeaderProps) {
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
          {voteMode === "available"
            ? tJoined("selectAvailableMode")
            : tJoined("selectUnavailableMode")}
        </h2>
        {/* Voting status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            hasSubmittedVote
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          }`}
        >
          {hasSubmittedVote ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {tJoined("voted")}
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {tJoined("notVoted")}
            </>
          )}
        </span>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
      >
        {saving
          ? t("saving")
          : hasSubmittedVote
            ? tJoined("updateVote")
            : tJoined("voteNow")}
      </button>
    </div>
  );
}
