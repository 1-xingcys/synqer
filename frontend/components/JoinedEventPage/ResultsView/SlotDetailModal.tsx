"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Vote, Participant } from "./types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface SlotRangeInfo {
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  slotIds: string[];
}

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateLabel: string;
  timeLabel: string;
  voters: Vote[];
  nonVoters: Participant[];
  totalFiltered: number;
  isRange?: boolean;
  // Host-only props for adding to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo) => void;
  rangeInfo?: SlotRangeInfo;
}

export function SlotDetailModal({
  isOpen,
  onClose,
  dateLabel,
  timeLabel,
  voters,
  nonVoters,
  totalFiltered,
  isRange = false,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  rangeInfo,
}: SlotDetailModalProps) {
  const t = useTranslations("joined");
  const tHosted = useTranslations("hosted");
  const modalRef = useRef<HTMLDivElement>(null);

  // Detect if it's a range based on dateLabel containing "~"
  const showRangeHint = isRange || dateLabel.includes("~");

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleAddToEventTime = () => {
    if (onAddToEventTime && rangeInfo) {
      onAddToEventTime(rangeInfo);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-gray-50 to-transparent dark:from-zinc-800/50 dark:to-transparent">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {dateLabel}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-mono">
                {timeLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-zinc-400"
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
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Summary */}
            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {voters.length}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-zinc-400 ml-1">
                      / {totalFiltered}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-zinc-400">
                  {t("results.available")}
                </span>
              </div>
              {/* Range hint */}
              {showRangeHint && (
                <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t("results.rangeHint")}
                </p>
              )}
            </div>

            {/* Available List */}
            <div className="mb-5">
              <h4 className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
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
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-semibold">
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
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("results.unavailableParticipants")} ({nonVoters.length})
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
                        <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700 text-white text-sm font-semibold">
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
              <div className="space-y-2">
                <button
                  onClick={handleAddToEventTime}
                  className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {tHosted("addToEventTime.button")}
                </button>
                {isVotingPhase && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {tHosted("addToEventTime.votingHint")}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={onClose}
                className="sm:hidden w-full py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {t("results.close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
