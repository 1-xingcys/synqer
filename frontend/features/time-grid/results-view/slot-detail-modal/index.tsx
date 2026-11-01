"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useCallback, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, Check, X, Info } from "lucide-react";
import { Vote, Participant } from "../../types";
import { ResultsAvailabilityMode, SlotRangeInfo } from "../types";
import { Z_INDEX } from "@/lib/ui/zIndex";
import { AddButtonView, CloseButtonView } from "./footerViews";

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateLabel: string;
  timeLabel: string;
  voters: Vote[];
  nonVoters: Participant[];
  notVoted: Participant[];
  totalFiltered: number;
  mode?: ResultsAvailabilityMode;
  isRange?: boolean;
  // Host-only props for adding to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo) => Promise<boolean>;
  rangeInfo?: SlotRangeInfo;
}

export function SlotDetailModal({
  isOpen,
  onClose,
  dateLabel,
  timeLabel,
  voters,
  nonVoters,
  notVoted,
  totalFiltered,
  mode = "available",
  isRange = false,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  rangeInfo,
}: SlotDetailModalProps) {
  const t = useTranslations("joined");
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Detect if it's a range based on dateLabel containing "~"
  const showRangeHint = isRange || dateLabel.includes("~");
  const isUnavailableMode = mode === "unavailable";
  const primaryCount = isUnavailableMode ? nonVoters.length : voters.length;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleConfirmAdd = async () => {
    if (!onAddToEventTime || !rangeInfo || isAdding) return;

    setIsAdding(true);
    try {
      const success = await onAddToEventTime(rangeInfo);
      if (success) {
        handleClose();
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${Z_INDEX.MODAL_BACKDROP} animate-in fade-in duration-200`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed ${Z_INDEX.MODAL_CONTENT} inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300`}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-linear-to-r from-gray-50 to-transparent dark:from-zinc-800/50 dark:to-transparent">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {dateLabel}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-mono">
                {timeLabel}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Summary */}
            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isUnavailableMode
                        ? "bg-[#ffe4e6] dark:bg-[#8813374D]"
                        : "bg-emerald-100 dark:bg-emerald-900/30"
                    }`}
                  >
                    {isUnavailableMode ? (
                      <X className="w-4 h-4 text-[#be123c] dark:text-[#fda4af]" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-lg font-bold ${
                        isUnavailableMode
                          ? "text-[#be123c] dark:text-[#fda4af]"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {primaryCount}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-zinc-400 ml-1">
                      / {totalFiltered}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-zinc-400">
                  {isUnavailableMode
                    ? t("results.unavailableParticipants")
                    : t("results.availableParticipants")}
                </span>
              </div>
              {/* Range hint */}
              {showRangeHint && (
                <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {t("results.rangeHint")}
                </p>
              )}
            </div>

            {isUnavailableMode ? (
              <>
                <div className="mb-5">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-[#be123c] dark:text-[#fda4af] mb-3">
                    <X className="w-4 h-4" />
                    {t("results.unavailableParticipants")} ({nonVoters.length})
                  </h4>
                  {nonVoters.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 py-2">
                      {notVoted.length === 0
                        ? t("everyoneAvailable")
                        : t("results.noOneUnavailable")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {nonVoters.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-[#fff1f2] dark:bg-[#88133740]"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={participant.pictureUrl}
                              alt={participant.displayName}
                            />
                            <AvatarFallback className="bg-linear-to-br from-[#fb7185] to-[#e11d48] text-white text-sm font-semibold">
                              {participant.displayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-[#9f1239] dark:text-[#fecdd3]">
                            {participant.displayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {voters.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                      <Check className="w-4 h-4" />
                      {t("results.availableParticipants")} ({voters.length})
                    </h4>
                    <div className="space-y-2">
                      {voters.map((voter) => (
                        <div
                          key={voter.userId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                        >
                          <Avatar className="w-8 h-8 shadow-sm">
                            <AvatarImage
                              src={voter.pictureUrl}
                              alt={voter.userDisplayName}
                            />
                            <AvatarFallback className="bg-linear-to-br from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700 text-white text-sm font-semibold">
                              {voter.userDisplayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            {voter.userDisplayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Available List */}
                <div className="mb-5">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3">
                    <Check className="w-4 h-4" />
                    {t("results.availableParticipants")} ({voters.length})
                  </h4>
                  {voters.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 py-2">
                      {t("results.noOneAvailable")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {voters.map((voter) => (
                        <div
                          key={voter.userId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
                        >
                          <Avatar className="w-8 h-8 shadow-sm">
                            <AvatarImage
                              src={voter.pictureUrl}
                              alt={voter.userDisplayName}
                            />
                            <AvatarFallback className="bg-linear-to-br from-emerald-400 to-emerald-600 text-white text-sm font-semibold">
                              {voter.userDisplayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {voter.userDisplayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unavailable List */}
                {nonVoters.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                      <X className="w-4 h-4" />
                      {t("results.unavailableParticipants")} ({nonVoters.length}
                      )
                    </h4>
                    <div className="space-y-2">
                      {nonVoters.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={participant.pictureUrl}
                              alt={participant.displayName}
                            />
                            <AvatarFallback className="bg-linear-to-br from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700 text-white text-sm font-semibold">
                              {participant.displayName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600 dark:text-zinc-400">
                            {participant.displayName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Not Voted List */}
            {notVoted.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  {t("results.notVoted")} ({notVoted.length})
                </h4>
                <div className="space-y-2">
                  {notVoted.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={participant.pictureUrl}
                          alt={participant.displayName}
                        />
                        <AvatarFallback className="bg-linear-to-br from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700 text-white text-sm font-semibold">
                          {participant.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        {participant.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - Add to Event Time (for Host) or Close (mobile) */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800">
            {canAddToEventTime && onAddToEventTime && rangeInfo ? (
              <AddButtonView
                isVotingPhase={isVotingPhase}
                onAdd={() => void handleConfirmAdd()}
                isLoading={isAdding}
              />
            ) : (
              <CloseButtonView onClose={handleClose} t={t} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
