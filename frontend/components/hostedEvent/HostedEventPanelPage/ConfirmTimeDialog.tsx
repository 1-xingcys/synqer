"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface ConfirmTimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isVotingPhase: boolean;
  slotsCount: number;
  isConfirming: boolean;
}

export function ConfirmTimeDialog({
  isOpen,
  onClose,
  onConfirm,
  isVotingPhase,
  slotsCount,
  isConfirming,
}: ConfirmTimeDialogProps) {
  const t = useTranslations("hosted");

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConfirming) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, isConfirming]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => !isConfirming && onClose()}
      />

      {/* Dialog */}
      <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              {isVotingPhase ? (
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-amber-600 dark:text-amber-400"
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
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t("confirmDialog.title")}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isVotingPhase ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t("confirmDialog.votingWarning")}
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <svg
                      className="w-4 h-4 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("confirmDialog.votingWarningDetail")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {t("confirmDialog.description", { count: slotsCount })}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors"
            >
              {t("confirmDialog.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 ${
                isVotingPhase
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("confirmDialog.confirming")}
                </>
              ) : (
                t("confirmDialog.confirm")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

