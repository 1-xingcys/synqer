"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";

interface ErrorViewProps {
  error?: string | null;
}

export function ErrorView({ error }: ErrorViewProps) {
  const t = useTranslations();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t("event.notFound")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {error || t("eventJoin.eventNotFoundDescription")}
        </p>
        <Link
          href={DEFAULT_OVERVIEW_PATH}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {t("event.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
