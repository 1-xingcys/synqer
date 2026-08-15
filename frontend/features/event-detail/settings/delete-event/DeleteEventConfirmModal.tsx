"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Z_INDEX } from "@/lib/ui/zIndex";

/** Seconds the confirm button stays locked so the warning gets read. */
const CONFIRM_DELAY_SECONDS = 3;

interface DeleteEventConfirmModalProps {
  open: boolean;
  /** Delete request in flight */
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteEventConfirmModal({
  open,
  deleting,
  onCancel,
  onConfirm,
}: DeleteEventConfirmModalProps) {
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onCancel]);

  if (!open || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className={`relative ${Z_INDEX.MODAL_CONTENT} flex min-h-full items-center justify-center p-4`}
      >
        <ConfirmDialog
          deleting={deleting}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Only mounted while the modal is open, so the countdown starts over every
 * time the host reopens it.
 */
function ConfirmDialog({
  deleting,
  onCancel,
  onConfirm,
}: Omit<DeleteEventConfirmModalProps, "open">) {
  const t = useTranslations();
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_DELAY_SECONDS);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const locked = secondsLeft > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="w-auto max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-center">
        {t("hosted.settingsPage.deleteEventConfirm.title")}
      </h3>

      <p className="mt-3 text-sm text-center text-zinc-500 dark:text-zinc-400">
        {t("hosted.settingsPage.deleteEventConfirm.warning")}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {!deleting && (
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={locked || deleting}
        >
          {deleting ? (
            <Spinner size="sm" tone="current" />
          ) : locked ? (
            `${t("common.delete")} (${secondsLeft})`
          ) : (
            t("common.delete")
          )}
        </Button>
      </div>
    </div>
  );
}
