"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";

interface ErrorViewProps {
  error?: string | null;
}

export function ErrorView({ error }: ErrorViewProps) {
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const router = useRouter();

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
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
        <p className="text-lg text-red-600 dark:text-red-400">
          {error || t("notFound")}
        </p>
        <button
          onClick={() => router.push(DEFAULT_OVERVIEW_PATH)}
          className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {tJoined("backToJoined")}
        </button>
      </div>
    </div>
  );
}
