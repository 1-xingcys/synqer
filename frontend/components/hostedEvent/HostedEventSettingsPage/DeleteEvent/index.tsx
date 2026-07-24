"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DeleteEventConfirmModal } from "./DeleteEventConfirmModal";
import { useDeleteEvent } from "./useDeleteEvent";

export function DeleteEvent() {
  const t = useTranslations();
  const { deleting, showConfirm, requestDelete, cancelDelete, confirmDelete } =
    useDeleteEvent();

  return (
    <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
          {t("hosted.settingsPage.dangerZone")}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("hosted.settingsPage.deleteEvent")}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t("hosted.settingsPage.deleteWarning")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={requestDelete}
            className="shrink-0 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-700"
          >
            {t("hosted.settingsPage.deleteEvent")}
          </Button>
        </div>
      </div>

      <DeleteEventConfirmModal
        open={showConfirm}
        deleting={deleting}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
