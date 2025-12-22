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
}

interface SelectedEventTimesProps {
  selectedRanges: SelectedTimeRange[];
  onRemove: (id: string) => void;
  onConfirm: () => void;
  isVotingPhase: boolean;
  isConfirming: boolean;
}

export function SelectedEventTimes({
  selectedRanges,
  onRemove,
  onConfirm,
  isVotingPhase,
  isConfirming,
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

  if (selectedRanges.length === 0) {
    return null;
  }

  const totalSlots = selectedRanges.reduce((acc, r) => acc + r.slotIds.length, 0);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-900/30">
        <div className="flex items-center justify-between">
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
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {t("selectedTimes.slotsCount", { count: totalSlots })}
          </span>
        </div>
      </div>

      {/* Time Ranges List */}
      <div className="p-4 space-y-3">
        {selectedRanges.map((range) => (
          <div
            key={range.id}
            className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-lg p-3 shadow-sm border border-blue-100 dark:border-zinc-800"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <span>{formatDateRange(range.startDate, range.endDate)}</span>
                <span className="text-zinc-400">•</span>
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {formatTime(range.startTime)} - {formatTime(range.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {range.availableCount}/{range.totalParticipants} {t("selectedTimes.available")}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span>{range.slotIds.length} {t("selectedTimes.slots")}</span>
              </div>
            </div>
            <button
              onClick={() => onRemove(range.id)}
              className="ml-3 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t("selectedTimes.remove")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer with Confirm Button */}
      <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-800 bg-blue-100/30 dark:bg-blue-900/20">
        {isVotingPhase && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t("selectedTimes.confirmButton")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

