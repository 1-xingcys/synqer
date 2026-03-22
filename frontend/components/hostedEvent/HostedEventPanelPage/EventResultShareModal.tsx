"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CheckCheck, Copy, Loader2, Share2, X } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndex";

interface EventResultShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  canNativeShareResultText: boolean;
  resultTextShareStatus: "idle" | "sending" | "success" | "error";
  resultTextCopied: boolean;
  onShareResultText: () => Promise<boolean> | boolean;
  showShareToLineOption: boolean;
  lineShareStatus: "idle" | "sending" | "success" | "error";
  onShareToLine: () => Promise<boolean> | boolean;
}

export function EventResultShareModal({
  isOpen,
  onClose,
  canNativeShareResultText,
  resultTextShareStatus,
  resultTextCopied,
  onShareResultText,
  showShareToLineOption,
  lineShareStatus,
  onShareToLine,
}: EventResultShareModalProps) {
  const tCommon = useTranslations("common");
  const tEventInfo = useTranslations("eventInfo");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") {
    return null;
  }

  const handleShareResultTextClick = async () => {
    if (resultTextShareStatus === "sending") return;

    const didShare = await onShareResultText();
    if (didShare && canNativeShareResultText) {
      onClose();
    }
  };

  const handleShareToLineClick = async () => {
    if (lineShareStatus === "sending") return;

    const didShare = await onShareToLine();
    if (didShare) {
      onClose();
    }
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-black/55 backdrop-blur-sm animate-in fade-in duration-200`}
        onClick={onClose}
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
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700"
              aria-label={tCommon("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-4">
            <button
              onClick={() => void handleShareResultTextClick()}
              disabled={resultTextShareStatus === "sending"}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                canNativeShareResultText
                  ? resultTextShareStatus === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : resultTextShareStatus === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700/70"
                  : resultTextCopied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700/70"
              }`}
            >
              <span className="flex items-center gap-2">
                {canNativeShareResultText ? (
                  resultTextShareStatus === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : resultTextShareStatus === "success" ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )
                ) : resultTextCopied ? (
                  <CheckCheck className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {canNativeShareResultText
                    ? resultTextShareStatus === "sending"
                      ? tEventInfo("sharingResultText")
                      : resultTextShareStatus === "success"
                        ? tEventInfo("resultTextShared")
                        : resultTextShareStatus === "error"
                          ? tEventInfo("shareResultTextFailed")
                          : tEventInfo("shareResultText")
                    : resultTextCopied
                      ? tEventInfo("resultTextCopied")
                      : tEventInfo("copyResultText")}
                </span>
              </span>
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                {canNativeShareResultText
                  ? resultTextShareStatus === "error"
                    ? tEventInfo("shareResultTextFailedHint")
                    : tEventInfo("shareResultTextHint")
                  : tEventInfo("copyResultTextHint")}
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
  );
}
