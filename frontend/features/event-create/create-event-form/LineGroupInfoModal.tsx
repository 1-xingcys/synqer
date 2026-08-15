"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Z_INDEX } from "@/lib/ui/zIndex";

interface LineGroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LineGroupInfoModal({
  isOpen,
  onClose,
}: LineGroupInfoModalProps) {
  const t = useTranslations();

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
        <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground">
            {t("createEvent.lineGroup.modal.title")}
          </h3>
          <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {t("createEvent.lineGroup.modal.quickShareNote")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("createEvent.lineGroup.modal.intro")}
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">
                {t("createEvent.lineGroup.modal.features.title")}
              </p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
                <li>{t("createEvent.lineGroup.modal.features.item1")}</li>
                <li>{t("createEvent.lineGroup.modal.features.item2")}</li>
                <li>{t("createEvent.lineGroup.modal.features.item3")}</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-foreground">
                {t("createEvent.lineGroup.modal.requirements.title")}
              </p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
                <li>{t("createEvent.lineGroup.modal.requirements.item1")}</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-foreground">
                {t("createEvent.lineGroup.modal.limitations.title")}
              </p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
                <li>{t("createEvent.lineGroup.modal.limitations.item1")}</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" onClick={onClose}>
              {t("createEvent.lineGroup.modal.close")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
