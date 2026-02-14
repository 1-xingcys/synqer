"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Share, Share2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { TimeGranularity } from "../types";
import { ResultsAvailabilityMode } from "./types";
import { Z_INDEX } from "@/lib/zIndex";

interface ResultsGridToolsMenuProps {
  mode: ResultsAvailabilityMode;
  onModeChange: (mode: ResultsAvailabilityMode) => void;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
  getShareableLink: () => string;
  onCopyShareLink: () => void;
  linkCopied: boolean;
}

const GRANULARITY_ITEMS: { value: TimeGranularity; labelKey: string }[] = [
  { value: 15, labelKey: "view15min" },
  { value: 30, labelKey: "view30min" },
  { value: 60, labelKey: "view1hr" },
];

export function ResultsGridToolsMenu({
  mode,
  onModeChange,
  granularity,
  onGranularityChange,
  getShareableLink,
  onCopyShareLink,
  linkCopied,
}: ResultsGridToolsMenuProps) {
  const tJoined = useTranslations("joined");
  const [open, setOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!isShareModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShareModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isShareModalOpen]);

  const openShareModal = () => {
    setOpen(false);
    setIsShareModalOpen(true);
  };

  const handleWebShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: tJoined("results.shareModalTitle"),
        text: tJoined("results.shareModalHint"),
        url: getShareableLink(),
      });
      setIsShareModalOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  };

  const canWebShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-8 px-2.5 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
          open
            ? "bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
            : "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
        }`}
        aria-label={tJoined("mobileTools.open")}
      >
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
            d="M4 6h16M7 12h10M10 18h4"
          />
        </svg>
        <span className="hidden sm:block text-xs sm:text-sm font-medium">
          {tJoined("mobileTools.tools")}
        </span>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1 ${Z_INDEX.GRID_BASE} w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1`}
        >
          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.mode")}
          </div>
          <button
            onClick={() => {
              onModeChange("available");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
              mode === "available"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
            }`}
          >
            <span>{tJoined("results.availableParticipants")}</span>
            {mode === "available" && <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              onModeChange("unavailable");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
              mode === "unavailable"
                ? "bg-[#fff1f2] text-[#be123c] dark:bg-[#8813374D] dark:text-[#fda4af]"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
            }`}
          >
            <span>{tJoined("results.unavailableParticipants")}</span>
            {mode === "unavailable" && <X className="w-4 h-4" />}
          </button>

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.view")}
          </div>
          {GRANULARITY_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onGranularityChange(item.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
                granularity === item.value
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
              }`}
            >
              <span>{tJoined(`mobileTools.${item.labelKey}`)}</span>
              {granularity === item.value && <Check className="w-4 h-4" />}
            </button>
          ))}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("results.shareViaSystem")}
          </div>
          <button
            onClick={() => {
              openShareModal();
            }}
            className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center gap-2 ${
              isShareModalOpen
                ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{tJoined("results.shareViaSystem")}</span>
          </button>
        </div>
      )}

      {typeof window !== "undefined" &&
        isShareModalOpen &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-black/55 backdrop-blur-sm animate-in fade-in duration-200`}
              onClick={() => setIsShareModalOpen(false)}
            />
            <div
              className={`fixed ${Z_INDEX.MODAL_CONTENT} inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300`}
            >
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/60">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {tJoined("results.shareModalTitle")}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {tJoined("results.shareModalHint")}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors items-center justify-center flex"
                    aria-label={tJoined("results.close")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <button
                    onClick={onCopyShareLink}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 border transition-colors ${
                      linkCopied
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        : "text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/70"
                    }`}
                  >
                    {linkCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>
                      {linkCopied
                        ? tJoined("results.linkCopied")
                        : tJoined("results.copyLink")}
                    </span>
                  </button>

                  <button
                    onClick={() => void handleWebShare()}
                    disabled={!canWebShare}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 border transition-colors ${
                      canWebShare
                        ? "text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/70"
                        : "text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                    }`}
                  >
                    <Share className="w-4 h-4" />
                    <span>{tJoined("results.shareViaSystem")}</span>
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
