"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Z_INDEX } from "@/lib/zIndex";
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

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const preventTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelConfirmCancel();
      }
    };

    document.addEventListener("touchmove", preventTouchMove, {
      passive: false,
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("touchmove", preventTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior =
        originalHtmlOverscrollBehavior;
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [showCancelConfirm, cancelConfirmCancel]);

  if (!showCancelConfirm || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP}`}>
      <div
        className="absolute inset-0 bg-black/50"
        onClick={cancelConfirmCancel}
      />
      <div
        className={`relative ${Z_INDEX.MODAL_CONTENT} flex min-h-full items-center justify-center p-4`}
      >
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
            <Button variant="destructive" onClick={() => void confirmCancel()}>
              {t("createEvent.cancelConfirm.discard")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
