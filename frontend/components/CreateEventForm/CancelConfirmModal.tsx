"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFormStateContext } from "./CreateEventFormContext";

export function CancelConfirmModal() {
  const t = useTranslations();
  const {
    state: { showCancelConfirm },
    actions: { cancelConfirmCancel, confirmCancel },
  } = useFormStateContext();

  useEffect(() => {
    if (!showCancelConfirm || typeof window === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelConfirmCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [showCancelConfirm, cancelConfirmCancel]);

  if (!showCancelConfirm || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={cancelConfirmCancel}
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">
                {t("createEvent.cancelConfirm.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("createEvent.cancelConfirm.description")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={cancelConfirmCancel}>
              {t("createEvent.cancelConfirm.keepEditing")}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t("createEvent.cancelConfirm.discard")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
