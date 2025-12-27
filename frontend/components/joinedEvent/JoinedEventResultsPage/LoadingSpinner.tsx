"use client";

import { useTranslations } from "next-intl";

export function LoadingSpinner() {
  const t = useTranslations("event");

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg text-zinc-600 dark:text-zinc-300">
          {t("loading")}
        </p>
      </div>
    </div>
  );
}
