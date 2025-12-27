"use client";

import { useTranslations } from "next-intl";

export function UnsavedChangesBadge() {
  const t = useTranslations();

  return (
    <div className="mb-2 px-2">
      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
        {t("hosted.participantsPage.unsavedChanges")}
      </span>
    </div>
  );
}
