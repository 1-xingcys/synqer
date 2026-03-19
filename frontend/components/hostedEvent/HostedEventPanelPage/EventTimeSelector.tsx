"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { formatMinutesToTime } from "@/lib/utils";
import { formatAxisKeyLabel } from "@/lib/event-presentation";
import type { EventSlotAxisType } from "@/types/event";
import {
  AlertTriangle,
  CheckCheck,
  Copy,
  Loader2,
  Share2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndex";

export interface SelectedTimeRange {
  id: string;
  startDate: string;
  endDate: string;
  axisType: EventSlotAxisType;
  startTime: number;
  endTime: number;
  slotIds: string[];
  isConfirmed?: boolean;
  isStaged?: boolean;
  isToBeRemoved?: boolean;
}

interface EventTimeSelectorProps {
  selectedRanges: SelectedTimeRange[];
  onRemove: (id: string) => Promise<void>;
  hasConfirmedTime: boolean;
  hasStagedChanges: boolean;
  onCommit: () => void;
  onDiscard: () => void;
  isPatchPending: boolean;
  isCommitPending: boolean;
  isDiscardPending: boolean;
  isVotingPhase: boolean;
  showShareResultButton?: boolean;
  resultTextCopied?: boolean;
  onCopyResultText?: () => void;
  showShareToLineOption?: boolean;
  lineShareStatus?: "idle" | "sending" | "success" | "error";
  onShareToLine?: () => Promise<boolean> | boolean;
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
  hasStagedChanges,
  onCommit,
  onDiscard,
  isPatchPending,
  isCommitPending,
  isDiscardPending,
  isVotingPhase,
  showShareResultButton = false,
  resultTextCopied = false,
  onCopyResultText,
  showShareToLineOption = false,
  lineShareStatus = "idle",
  onShareToLine,
}: EventTimeSelectorProps) {
  const locale = useLocale();
  const tHosted = useTranslations("hosted");
  const tCommon = useTranslations("common");
  const tEventInfo = useTranslations("eventInfo");
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [isShareResultModalOpen, setIsShareResultModalOpen] = useState(false);

  const formatDateRange = (
    startDate: string,
    endDate: string,
    axisType: EventSlotAxisType,
  ) => {
    if (startDate === endDate) {
      return formatAxisKeyLabel(startDate, axisType, locale);
    }
    return `${formatAxisKeyLabel(startDate, axisType, locale)} - ${formatAxisKeyLabel(endDate, axisType, locale)}`;
  };
  useEffect(() => {
    if (!isShareResultModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShareResultModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isShareResultModalOpen]);

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

  const handleShareToLineClick = async () => {
    if (!onShareToLine || lineShareStatus === "sending") return;

    const didShare = await onShareToLine();
    if (didShare) {
      setIsShareResultModalOpen(false);
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
            {showShareResultButton && (
              <button
                onClick={() => setIsShareResultModalOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
                title={tEventInfo("shareResult")}
                aria-label={tEventInfo("shareResult")}
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </div>
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
                  range.isToBeRemoved
                    ? "border-dashed bg-rose-100 dark:bg-rose-900/15 border-rose-300 dark:border-rose-800"
                    : range.isStaged
                      ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                  {/* Date and time */}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateRange(
                      range.startDate,
                      range.endDate,
                      range.axisType,
                    )}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {formatMinutesToTime(range.startTime)} -{" "}
                    {formatMinutesToTime(range.endTime)}
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
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-2">
            {tHosted("eventTimeSelector.noConfirmedTime")}
          </p>
        )}
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

      {typeof window !== "undefined" &&
        isShareResultModalOpen &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-black/55 backdrop-blur-sm animate-in fade-in duration-200`}
              onClick={() => setIsShareResultModalOpen(false)}
            />
            <div
              className={`fixed ${Z_INDEX.MODAL_CONTENT} inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300`}
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900/95">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {tEventInfo("shareResultTitle")}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {tEventInfo("shareResultHint")}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsShareResultModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    aria-label={tCommon("close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 p-4">
                  <button
                    onClick={() => {
                      if (onCopyResultText) {
                        onCopyResultText();
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      resultTextCopied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700/70"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {resultTextCopied ? (
                        <CheckCheck className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {resultTextCopied
                          ? tEventInfo("resultTextCopied")
                          : tEventInfo("copyResultText")}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                      {tEventInfo("copyResultTextHint")}
                    </span>
                  </button>
                  {showShareToLineOption && (
                    <button
                      onClick={() => void handleShareToLineClick()}
                      disabled={lineShareStatus === "sending"}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        lineShareStatus === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : lineShareStatus === "error"
                            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700/70"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {lineShareStatus === "sending" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : lineShareStatus === "success" ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {lineShareStatus === "sending"
                            ? tEventInfo("sharingToLine")
                            : lineShareStatus === "success"
                              ? tEventInfo("sharedToLine")
                              : lineShareStatus === "error"
                                ? tEventInfo("shareToLineFailed")
                                : tEventInfo("shareToLine")}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                        {lineShareStatus === "error"
                          ? tEventInfo("shareToLineFailedHint")
                          : tEventInfo("shareToLineHint")}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
