"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { formatMinutesToTime } from "@/lib/utils";

export interface SelectedTimeRange {
  id: string;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotIds: string[];
  availableCount: number;
  totalParticipants: number;
  isConfirmed?: boolean;
}

interface EventTimeSelectorProps {
  selectedRanges: SelectedTimeRange[];
  onRemove: (id: string) => void;
  onConfirm: () => void;
  onReset: () => void | Promise<void>;
  isVotingPhase: boolean;
  isVotingEnded: boolean;
  isConfirming: boolean;
  isResetting: boolean;
  hasUserSelection: boolean;
  hasConfirmedTime: boolean;
}

export function EventTimeSelector({
  selectedRanges,
  onRemove,
  onConfirm,
  onReset,
  isVotingPhase,
  isVotingEnded,
  isConfirming,
  isResetting,
  hasUserSelection,
  hasConfirmedTime,
}: EventTimeSelectorProps) {
  const t = useTranslations("hosted");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return format(start, "M/d (EEE)");
    }
    return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    await onReset();
    setShowResetConfirm(false);
  };

  const isEmpty = selectedRanges.length === 0;
  const hasAnySelection = selectedRanges.length > 0 || hasConfirmedTime;

  // Determine title based on state
  const getTitle = () => {
    if (hasConfirmedTime && !hasUserSelection) {
      return t("eventTimeSelector.confirmedTitle");
    }
    if (hasUserSelection) {
      return t("eventTimeSelector.selectingTitle");
    }
    return t("eventTimeSelector.emptyTitle");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {getTitle()}
            </h3>
          </div>

          {/* Reset button */}
          {hasAnySelection && (
            <button
              onClick={handleResetClick}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isResetting ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-3 h-3"
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
              {t("eventTimeSelector.reset")}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Warning for voting ended without selection */}
        {isVotingEnded && !hasConfirmedTime && isEmpty && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {t("eventTimeSelector.votingEndedWarning")}
            </p>
          </div>
        )}

        {/* Time ranges list */}
        {isEmpty ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-4">
            {t("eventTimeSelector.emptyHint")}
          </p>
        ) : (
          <div className="space-y-2">
            {selectedRanges.map((range) => (
              <div
                key={range.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                  range.isConfirmed
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                  {/* Status indicator */}
                  {range.isConfirmed ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium shrink-0">
                      {range.availableCount}
                    </span>
                  )}

                  {/* Date and time */}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateRange(range.startDate, range.endDate)}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {formatMinutesToTime(range.startTime)} -{" "}
                    {formatMinutesToTime(range.endTime)}
                  </span>

                  {/* Available count for non-confirmed */}
                  {!range.isConfirmed && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      ({range.availableCount}/{range.totalParticipants})
                    </span>
                  )}
                </div>

                {/* Remove button for non-confirmed */}
                {!range.isConfirmed && (
                  <button
                    onClick={() => onRemove(range.id)}
                    className="ml-2 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    title={t("eventTimeSelector.remove")}
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Confirm button */}
      {hasUserSelection && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          {isVotingPhase && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {t("eventTimeSelector.votingNotEnded")}
            </p>
          )}
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("eventTimeSelector.confirming")}
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("eventTimeSelector.confirm")}
              </>
            )}
          </button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
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
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("eventTimeSelector.resetConfirmTitle")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("eventTimeSelector.resetConfirmDesc")}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {t("eventTimeSelector.cancel")}
              </button>
              <button
                onClick={() => void handleConfirmReset()}
                disabled={isResetting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isResetting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {t("eventTimeSelector.resetConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
