"use client";

import { useTranslations } from "next-intl";

interface VotingStatusBadgeProps {
  hasVoted: boolean;
}

export default function VotingStatusBadge({
  hasVoted,
}: VotingStatusBadgeProps) {
  const t = useTranslations();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        hasVoted
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
      }`}
    >
      {hasVoted ? (
        <>
          <svg
            className="w-3 h-3"
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
          {t("participantStatus.voted")}
        </>
      ) : (
        <>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t("participantStatus.notVoted")}
        </>
      )}
    </span>
  );
}
