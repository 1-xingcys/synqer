"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { formatMinutesToTime } from "@/lib/utils";
import { Calendar, X, RotateCcw, Loader2, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  onReset: () => void | Promise<void>;
  isRemoving: boolean;
  isResetting: boolean;
  hasConfirmedTime: boolean;
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  icon: LucideIcon;
  title: string;
  cancelText: string;
  confirmText: string;
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  icon: Icon,
  title,
  cancelText,
  confirmText,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-80 mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {title}
          </h3>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EventTimeSelector({
  selectedRanges,
  onRemove,
  onReset,
  isRemoving,
  isResetting,
  hasConfirmedTime,
}: EventTimeSelectorProps) {
  const t = useTranslations("hosted");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(
    null,
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const handleRemoveClick = (id: string) => {
    setShowRemoveConfirm(id);
  };

  const handleConfirmRemove = () => {
    if (showRemoveConfirm) {
      setRemovingId(showRemoveConfirm);
      onRemove(showRemoveConfirm);
      setShowRemoveConfirm(null);
    }
  };

  const isEmpty = selectedRanges.length === 0;

  // Determine title based on state
  const getTitle = () => {
    if (hasConfirmedTime) {
      return t("eventTimeSelector.confirmedTitle");
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
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {getTitle()}
            </h3>
          </div>

          {hasConfirmedTime && (
            <button
              onClick={handleResetClick}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isResetting ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              {t("eventTimeSelector.reset")}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Time ranges list */}
        {!isEmpty ? (
          <div className="space-y-2">
            {selectedRanges.map((range) => {
              const isThisRemoving = removingId === range.id && isRemoving;
              return (
                <div
                  key={range.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                    {/* Date and time */}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatDateRange(range.startDate, range.endDate)}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {formatMinutesToTime(range.startTime)} -{" "}
                      {formatMinutesToTime(range.endTime)}
                    </span>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveClick(range.id)}
                    disabled={isRemoving}
                    className="ml-2 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors shrink-0"
                    title={t("eventTimeSelector.remove")}
                  >
                    {isThisRemoving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-2">
            {t("eventTimeSelector.noConfirmedTime")}
          </p>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => void handleConfirmReset()}
        isLoading={isResetting}
        icon={RotateCcw}
        title={t("eventTimeSelector.resetConfirmTitle")}
        cancelText={t("eventTimeSelector.cancel")}
        confirmText={t("eventTimeSelector.resetConfirm")}
      />

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveConfirm !== null}
        onClose={() => setShowRemoveConfirm(null)}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
        icon={Trash2}
        title={t("eventTimeSelector.removeConfirmTitle")}
        cancelText={t("eventTimeSelector.cancel")}
        confirmText={t("eventTimeSelector.removeConfirm")}
      />
    </div>
  );
}
