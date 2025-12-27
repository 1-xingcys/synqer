"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface AlreadyParticipantViewProps {
  eventId: string;
  eventTitle: string | null;
  hasVoted: boolean;
}

export function AlreadyParticipantView({
  eventId,
  eventTitle,
  hasVoted,
}: AlreadyParticipantViewProps) {
  const t = useTranslations();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t("eventJoin.alreadyParticipant")}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-2">
          {t("eventJoin.alreadyParticipantDescription")}
        </p>
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-6">
          {eventTitle || t("event.untitled")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/joined/${eventId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {hasVoted ? t("eventJoin.goToEvent") : t("eventJoin.goToVote")}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
