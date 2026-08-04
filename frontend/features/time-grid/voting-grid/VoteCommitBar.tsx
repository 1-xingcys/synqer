"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CommitFeedback } from "./hooks/useOptimisticVoting";

interface VoteCommitBarProps {
  hasStagedVoteDraft: boolean;
  hasCommittedVote: boolean;
  isPatchPending: boolean;
  isCommitPending: boolean;
  commitFeedback: CommitFeedback;
  onCommit: () => void;
}

export function VoteCommitBar({
  hasStagedVoteDraft,
  hasCommittedVote,
  isPatchPending,
  isCommitPending,
  commitFeedback,
  onCommit,
}: VoteCommitBarProps) {
  const t = useTranslations("joined");

  const showBar = hasStagedVoteDraft || commitFeedback !== "idle";

  if (!showBar) {
    return <div className="h-[8px]" />;
  }

  if (commitFeedback === "success") {
    return (
      <>
        <div className="h-[4px] sm:h-[8px]" />
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 sm:px-4 sm:py-2.5">
          <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {t("voteCommitSuccess")}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="h-[4px] sm:h-[8px]" />
      <div
        className={`rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 ${
          commitFeedback === "error"
            ? "border border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20"
            : "border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20"
        }`}
      >
        <p
          className={`text-xs sm:text-sm ${
            commitFeedback === "error"
              ? "text-rose-800 dark:text-rose-200"
              : "text-sky-800 dark:text-sky-200"
          }`}
        >
          {commitFeedback === "error"
            ? t("voteCommitFailed")
            : hasCommittedVote
              ? t("stagedVotePending")
              : t("firstVotePending")}
        </p>
        <button
          onClick={onCommit}
          disabled={isPatchPending || isCommitPending}
          className={`shrink-0 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 ${
            commitFeedback === "error"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {isCommitPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isCommitPending ? t("confirmingVote") : t("confirmVote")}
        </button>
      </div>
    </>
  );
}
