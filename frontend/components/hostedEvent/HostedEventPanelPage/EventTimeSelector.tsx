"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { formatMinutesToTime } from "@/lib/utils";
import { AlertTriangle, Calendar, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndex";

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
  isStaged?: boolean;
}

interface EventTimeSelectorProps {
  selectedRanges: SelectedTimeRange[];
  onRemove: (id: string) => void;
  hasConfirmedTime: boolean;
  hasStagedChanges?: boolean;
  onCommit: () => void;
  onDiscard: () => void;
  isCommitPending?: boolean;
  isDiscardPending?: boolean;
  isVotingPhase?: boolean;
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  cancelText: string;
  confirmText: string;
  isConfirmDisabled?: boolean;
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  icon: Icon,
  title,
  description,
  cancelText,
  confirmText,
  isConfirmDisabled = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${Z_INDEX.MODAL_CONTENT} flex items-center justify-center`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-80 mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-line">
              {description}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap"
          >
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
  hasConfirmedTime,
  hasStagedChanges = false,
  onCommit,
  onDiscard,
  isCommitPending = false,
  isDiscardPending = false,
  isVotingPhase = false,
}: EventTimeSelectorProps) {
  const t = useTranslations("hosted");
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return format(start, "M/d (EEE)");
    }
    return `${format(start, "M/d")} - ${format(end, "M/d")}`;
  };

  const handleCommitClick = () => {
    if (isVotingPhase) {
      setShowCommitConfirm(true);
      return;
    }
    void onCommit();
  };

  const handleConfirmCommit = () => {
    onCommit();
    setShowCommitConfirm(false);
  };

  const isEmpty = selectedRanges.length === 0;

  // Determine title based on state
  const getTitle = () => {
    if (hasStagedChanges) {
      return t("eventTimeSelector.stagedTitle");
    }
    if (hasConfirmedTime) {
      return t("eventTimeSelector.confirmedTitle");
    }
    return t("eventTimeSelector.emptyTitle");
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {getTitle()}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Time ranges list */}
        {!isEmpty ? (
          <div className="space-y-2">
            {selectedRanges.map((range) => (
              <div
                key={range.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                  range.isStaged
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
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
                  onClick={() => onRemove(range.id)}
                  className="ml-2 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title={t("eventTimeSelector.remove")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-2">
            {t("eventTimeSelector.noConfirmedTime")}
          </p>
        )}
      </div>

      {hasStagedChanges && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <button
            onClick={() => void onDiscard()}
            disabled={isCommitPending || isDiscardPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {t("eventTimeSelector.discard")}
          </button>
          <button
            onClick={handleCommitClick}
            disabled={isCommitPending || isDiscardPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isCommitPending
              ? t("eventTimeSelector.saving")
              : t("eventTimeSelector.save")}
            {isCommitPending && <Loader2 className="w-4 h-4 animate-spin" />}
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCommitConfirm}
        onClose={() => setShowCommitConfirm(false)}
        onConfirm={() => void handleConfirmCommit()}
        icon={AlertTriangle}
        title={t("confirmDialog.votingWarning")}
        description={t("confirmDialog.votingWarningDetail")}
        cancelText={t("confirmDialog.cancel")}
        confirmText={
          isCommitPending
            ? t("confirmDialog.confirming")
            : t("confirmDialog.confirm")
        }
        isConfirmDisabled={isCommitPending}
      />
    </div>
  );
}
