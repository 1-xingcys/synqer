"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Z_INDEX } from "@/lib/ui/zIndex";

interface ClearDeadlineConfirmModalProps {
  open: boolean;
  /** Clear request in flight */
  saving: boolean;
  /** Message shown when clearing fails; on success the parent closes the modal */
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ClearDeadlineConfirmModal({
  open,
  saving,
  error,
  onCancel,
  onConfirm,
}: ClearDeadlineConfirmModalProps) {
  const t = useTranslations();

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
        <div
          role="dialog"
          aria-modal="true"
          className="w-auto max-w-md rounded-lg border border-border bg-background p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-center">
            {t("hosted.settingsPage.clearDeadlineConfirm.title")}
          </h3>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-center gap-3">
            {!saving && (
              <Button variant="outline" onClick={onCancel}>
                {t("hosted.settingsPage.clearDeadlineConfirm.keep")}
              </Button>
            )}
            <Button onClick={onConfirm} disabled={saving} autoFocus>
              {saving ? (
                <Spinner size="sm" tone="current" className="mr-2" />
              ) : (
                t("hosted.settingsPage.clearDeadlineConfirm.confirm")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
