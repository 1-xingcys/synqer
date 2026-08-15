"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Z_INDEX } from "@/lib/ui/zIndex";

/**
 * Visual weight of a single share option. Callers own the state machine that
 * decides which tone applies; this component only renders it.
 */
export type ShareOptionTone = "default" | "success" | "error";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Accessible label for the close button. */
  closeLabel: string;
  /** A list of ShareOption elements. */
  children: ReactNode;
}

/**
 * Bottom sheet on mobile, centered dialog on desktop. Owns the portal, scroll
 * lock, Escape handling and the card chrome so every share surface in the app
 * looks like the same component.
 */
export function ShareSheet({
  isOpen,
  onClose,
  title,
  closeLabel,
  children,
}: ShareSheetProps) {
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

  return createPortal(
    <>
      <div
        className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-black/55 backdrop-blur-sm animate-in fade-in duration-200`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed ${Z_INDEX.MODAL_CONTENT} inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300`}
      >
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-4">{children}</div>
        </div>
      </div>
    </>,
    document.body,
  );
}

const TONE_STYLES: Record<
  ShareOptionTone,
  { row: string; rowHover: string; icon: string; label: string }
> = {
  default: {
    row: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50",
    rowHover: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
    icon: "text-zinc-500 dark:text-zinc-400",
    label: "text-zinc-900 dark:text-zinc-100",
  },
  success: {
    row: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
    rowHover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/35",
    icon: "text-emerald-600 dark:text-emerald-400",
    label: "text-emerald-800 dark:text-emerald-200",
  },
  error: {
    row: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20",
    rowHover: "hover:bg-rose-100 dark:hover:bg-rose-900/35",
    icon: "text-rose-600 dark:text-rose-400",
    label: "text-rose-800 dark:text-rose-200",
  },
};

interface ShareOptionProps {
  icon: ReactNode;
  label: string;
  tone?: ShareOptionTone;
  disabled?: boolean;
  onClick: () => void;
}

/** One actionable row inside a ShareSheet. */
export function ShareOption({
  icon,
  label,
  tone = "default",
  disabled = false,
  onClick,
}: ShareOptionProps) {
  const styles = TONE_STYLES[tone];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2.5 sm:px-3 sm:py-2.5 ${styles.row} ${disabled ? "" : styles.rowHover}`}
    >
      <span className={`flex shrink-0 items-center ${styles.icon}`}>
        {icon}
      </span>
      <span
        className={`min-w-0 text-xs font-medium sm:text-sm ${styles.label}`}
      >
        {label}
      </span>
    </button>
  );
}
