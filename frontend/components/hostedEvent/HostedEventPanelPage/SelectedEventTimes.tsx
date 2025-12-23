"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";

export interface SelectedTimeRange {
  id: string;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotIds: string[];
  availableCount: number;
  totalParticipants: number;
  isConfirmed?: boolean; // 是否為已確認的時間（來自資料庫）
}

interface SelectedEventTimesProps {
  selectedRanges: SelectedTimeRange[];
  onRemove: (id: string) => void;
  onConfirm: () => void;
  isVotingPhase: boolean;
  isConfirming: boolean;
  hasUserSelection: boolean; // 是否有使用者新選的時間
}

export function SelectedEventTimes({
  selectedRanges,
  onRemove,
  onConfirm,
  isVotingPhase,
  isConfirming,
  hasUserSelection,
}: SelectedEventTimesProps) {
  const t = useTranslations("hosted");

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return format(start, "M/d (EEE)");
    }
    return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  };

  const isEmpty = selectedRanges.length === 0;

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-900/30">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            {t("selectedTimes.title")}
          </h3>
        </div>
      </div>

      {/* Time Ranges List or Empty State */}
      <div className="p-4">
        {isEmpty ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-2">
            {t("selectedTimes.empty")}
          </p>
        ) : (
          <div className="space-y-2">
            {selectedRanges.map((range) => (
              <div
                key={range.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 shadow-sm border ${
                  range.isConfirmed
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-zinc-900 border-blue-100 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 flex-wrap">
                  {/* Confirmed badge */}
                  {range.isConfirmed && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
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
                      {t("selectedTimes.confirmed")}
                    </span>
                  )}
                  <span className="font-medium">
                    {formatDateRange(range.startDate, range.endDate)}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {formatTime(range.startTime)} - {formatTime(range.endTime)}
                  </span>
                  {/* Only show available count for non-confirmed ranges */}
                  {!range.isConfirmed && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
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
                      {range.availableCount}/{range.totalParticipants}
                    </span>
                  )}
                </div>
                {/* Only show remove button for non-confirmed ranges */}
                {!range.isConfirmed && (
                  <button
                    onClick={() => onRemove(range.id)}
                    className="ml-2 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    title={t("selectedTimes.remove")}
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

      {/* Footer with Confirm Button - only show when user has new selections */}
      {hasUserSelection && (
        <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-800 bg-blue-100/30 dark:bg-blue-900/20">
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
              {t("selectedTimes.votingNotEnded")}
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
                {t("selectedTimes.confirming")}
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
                {t("selectedTimes.confirmButton")}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
