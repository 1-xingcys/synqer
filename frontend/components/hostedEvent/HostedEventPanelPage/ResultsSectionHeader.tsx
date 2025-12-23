"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ResultsSectionHeaderProps {
  hasConfirmedTime: boolean;
  isVotingEnded: boolean;
  hasAnySelection: boolean;
  isResetting: boolean;
  onReset: () => void | Promise<void>;
}

export function ResultsSectionHeader({
  hasConfirmedTime,
  isVotingEnded,
  hasAnySelection,
  isResetting,
  onReset,
}: ResultsSectionHeaderProps) {
  const t = useTranslations();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    await onReset();
    setShowResetConfirm(false);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {hasConfirmedTime
              ? t("hosted.confirmedEventTime")
              : isVotingEnded
                ? t("hosted.selectEventTimeNow")
                : t("hosted.currentResults")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {hasConfirmedTime
              ? t("hosted.confirmedTimeHint")
              : isVotingEnded
                ? t("hosted.votingEndedSelectHint")
                : t("hosted.selectTimeHint")}
          </p>
        </div>

        {/* Reset button - show when there are selections */}
        {hasAnySelection && (
          <button
            onClick={handleResetClick}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isResetting ? (
              <div className="w-4 h-4 border-2 border-orange-600 dark:border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {isResetting ? t("hosted.resetting") : t("hosted.resetEventTime")}
          </button>
        )}
      </div>

      {/* Highlight box for voting ended state without confirmed time */}
      {isVotingEnded && !hasConfirmedTime && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t("hosted.pleaseSelectEventTime")}
          </p>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelReset}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("hosted.resetConfirm.title")}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {t("hosted.resetConfirm.description")}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelReset}
                disabled={isResetting}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => void handleConfirmReset()}
                disabled={isResetting}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-lg transition-colors flex items-center gap-2"
              >
                {isResetting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {t("hosted.resetConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
