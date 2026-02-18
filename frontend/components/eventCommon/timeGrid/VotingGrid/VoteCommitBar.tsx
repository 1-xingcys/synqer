"use client";

import { useTranslations } from "next-intl";

interface VoteCommitBarProps {
  hasStagedVoteDraft: boolean;
  isCommitPending: boolean;
  onCommit: () => void;
}

export function VoteCommitBar({
  hasStagedVoteDraft,
  isCommitPending,
  onCommit,
}: VoteCommitBarProps) {
  const t = useTranslations("joined");

  if (!hasStagedVoteDraft) {
    return <div className="h-[8px]" />;
  }

  return (
    <>
      <div className="h-[4px] sm:h-[8px]" />
      <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-sky-800 dark:text-sky-200">
          {t("stagedVotePending")}
        </p>
        <button
          onClick={onCommit}
          disabled={isCommitPending}
          className="shrink-0 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium px-3 py-1.5 transition-colors"
        >
          {isCommitPending ? t("confirmingVote") : t("confirmVote")}
        </button>
      </div>
    </>
  );
}
