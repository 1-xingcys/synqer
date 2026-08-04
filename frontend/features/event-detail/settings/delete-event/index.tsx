"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DeleteEventConfirmModal } from "./DeleteEventConfirmModal";
import { useDeleteEvent } from "./useDeleteEvent";

export function DeleteEvent() {
  const t = useTranslations();
  const { deleting, showConfirm, requestDelete, cancelDelete, confirmDelete } =
    useDeleteEvent();

  // The irreversibility warning lives in the confirm modal, so the section
  // itself stays as quiet as the other settings blocks.
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t("hosted.settingsPage.deleteEvent")}
      </h2>

      <hr className="my-2 border-t border-gray-300" />

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t("hosted.settingsPage.deleteEventConfirm.warning")}
      </p>

      <div className="my-4">
        <Button variant="destructive" onClick={requestDelete}>
          {t("hosted.settingsPage.deleteEvent")}
        </Button>
      </div>

      <DeleteEventConfirmModal
        open={showConfirm}
        deleting={deleting}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
