"use client";

import { useTranslations } from "next-intl";

interface DangerZoneProps {
  showDeleteConfirm: boolean;
  deleting: boolean;
  onDeleteClick: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function DangerZone({
  showDeleteConfirm,
  deleting,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: DangerZoneProps) {
  const t = useTranslations();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
        {t("hosted.settingsPage.dangerZone")}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        {t("hosted.settingsPage.deleteWarning")}
      </p>
      {!showDeleteConfirm ? (
        <button
          onClick={onDeleteClick}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          {t("hosted.settingsPage.deleteEvent")}
        </button>
      ) : (
        <DeleteConfirmation
          deleting={deleting}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      )}
    </div>
  );
}

function DeleteConfirmation({
  deleting,
  onConfirm,
  onCancel,
}: {
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-red-600 dark:text-red-400">
        {t("hosted.settingsPage.confirmDelete")}
      </p>
      <button
        onClick={onConfirm}
        disabled={deleting}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {deleting ? t("common.loading") : t("common.delete")}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-sm font-medium"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
