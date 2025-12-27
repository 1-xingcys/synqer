"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface NotParticipantViewProps {
  eventId: string;
  eventTitle?: string;
}

export function NotParticipantView({ eventTitle }: NotParticipantViewProps) {
  const t = useTranslations();

  return (
    <div className="py-8">
      {/* Not Participant Message */}
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-500"
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

          {/* Title */}
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t("joined.notParticipant.title")}
          </h2>

          {/* Event Title (if available) */}
          {eventTitle && (
            <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-4">
              {eventTitle}
            </p>
          )}

          {/* Description */}
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            {t("joined.notParticipant.description")}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Back to Events Button */}
            <Link
              href="/joined"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("joined.notParticipant.backToOverview")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
