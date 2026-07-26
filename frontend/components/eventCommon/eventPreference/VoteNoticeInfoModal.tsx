"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Z_INDEX } from "@/lib/zIndex";
import { VoteNoticeFlexPreview } from "./VoteNoticeFlexPreview";

interface VoteNoticeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Explains the vote notice by showing it.
 *
 * The setting reads as a plain switch, but what it commits the host to is a
 * message appearing in someone else's chat — worth seeing before turning on.
 */
export function VoteNoticeInfoModal({
  isOpen,
  onClose,
}: VoteNoticeInfoModalProps) {
  const t = useTranslations("eventPreference.voteNotice.modal");

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative ${Z_INDEX.MODAL_CONTENT} flex min-h-full items-center justify-center p-4`}
      >
        <div className="w-full max-w-[19rem] rounded-lg border border-border bg-background p-4 shadow-lg sm:max-w-md sm:p-6">
          <h3 className="text-sm font-semibold text-foreground sm:text-lg">
            {t("title")}
          </h3>
          <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">
            {t("intro")}
          </p>

          <div className="mt-3 sm:mt-4">
            <VoteNoticeFlexPreview />
          </div>

          <div className="mt-4 flex justify-end sm:mt-6">
            <Button
              type="button"
              size="sm"
              className="sm:h-9 sm:px-4 sm:py-2"
              onClick={onClose}
            >
              {t("close")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
