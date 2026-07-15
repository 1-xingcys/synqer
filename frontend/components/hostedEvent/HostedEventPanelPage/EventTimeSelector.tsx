"use client";

import { type ReactNode, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndex";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";
import type { SelectedTimeRange } from "./types";

interface EventTimeSelectorProps {
  selectedRanges: SelectedTimeRange[];
  timeZone: string;
  onRemove: (id: string) => Promise<void>;
  hasConfirmedTime: boolean;
  hasStagedChanges: boolean;
  onCommit: () => void;
  onDiscard: () => void;
  isPatchPending: boolean;
  isCommitPending: boolean;
  isDiscardPending: boolean;
  isVotingPhase: boolean;
  headerAction?: ReactNode;
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
  timeZone,
  onRemove,
  hasConfirmedTime,
  hasStagedChanges,
  onCommit,
  onDiscard,
  isPatchPending,
  isCommitPending,
  isDiscardPending,
  isVotingPhase,
  headerAction,
}: EventTimeSelectorProps) {
  const locale = useLocale();
  const tHosted = useTranslations("hosted");
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

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

  const handleRemoveClick = async (rangeId: string) => {
    setPendingRemoveId(rangeId);
    try {
      await onRemove(rangeId);
    } finally {
      setPendingRemoveId((current) => (current === rangeId ? null : current));
    }
  };

  const isEmpty = selectedRanges.length === 0;
  const isActionPending = isPatchPending || isCommitPending || isDiscardPending;

  const statusText = hasStagedChanges
    ? {
        label: tHosted("eventTimeSelector.statusPendingChanges"),
        className: "text-orange-600 dark:text-orange-400 border-none",
      }
    : hasConfirmedTime
      ? {
          label: tHosted("eventTimeSelector.statusConfirmed"),
          className: "text-emerald-600 dark:text-emerald-400 border-none",
        }
      : {
          label: tHosted("eventTimeSelector.statusUnconfirmed"),
          className: "text-orange-600 dark:text-orange-400 border-none",
        };
  if (isEmpty) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {tHosted("eventTimeSelector.title")}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusText.className}`}
            >
              {statusText.label}
            </span>
            {headerAction}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Time ranges list */}
        <div className="space-y-2">
          {selectedRanges.map((range) => (
            <div
              key={range.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                range.isToBeRemoved
                  ? "border-dashed bg-rose-100 dark:bg-rose-900/15 border-rose-300 dark:border-rose-800"
                  : range.isStaged
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatLocalizedRangeLabel(
                    {
                      axisType: range.axisType,
                      startDate: range.startDate,
                      endDate: range.endDate,
                      startMinute: range.startTime,
                      endMinute: range.endTime,
                    },
                    locale,
                    { timeZone },
                  )}
                </span>
              </div>

              {!range.isToBeRemoved && (
                <button
                  onClick={() => void handleRemoveClick(range.id)}
                  disabled={isActionPending}
                  className="ml-2 p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={tHosted("eventTimeSelector.remove")}
                >
                  {pendingRemoveId === range.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {hasStagedChanges && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <button
            onClick={() => void onDiscard()}
            disabled={isActionPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isDiscardPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {tHosted("eventTimeSelector.discard")}
            </span>
          </button>
          <button
            onClick={handleCommitClick}
            disabled={isActionPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isCommitPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCommitPending
              ? tHosted("eventTimeSelector.saving")
              : tHosted("eventTimeSelector.save")}
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCommitConfirm}
        onClose={() => setShowCommitConfirm(false)}
        onConfirm={() => void handleConfirmCommit()}
        icon={AlertTriangle}
        title={tHosted("confirmDialog.votingWarning")}
        description={tHosted("confirmDialog.votingWarningDetail")}
        cancelText={tHosted("confirmDialog.cancel")}
        confirmText={
          isCommitPending
            ? tHosted("confirmDialog.confirming")
            : tHosted("confirmDialog.confirm")
        }
        isConfirmDisabled={isCommitPending}
      />
    </div>
  );
}
