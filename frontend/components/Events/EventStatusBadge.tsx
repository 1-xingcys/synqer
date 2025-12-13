"use client";

import { useTranslations } from "next-intl";
import { EventStatus } from "@/types/event";

interface EventStatusBadgeProps {
  status: EventStatus;
  size?: "sm" | "md";
}

export function EventStatusBadge({
  status,
  size = "md",
}: EventStatusBadgeProps) {
  const t = useTranslations();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const statusConfig: Record<
    EventStatus,
    { label: string; className: string; icon: JSX.Element }
  > = {
    [EventStatus.VOTING]: {
      label: t("eventStatus.voting"),
      className:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    [EventStatus.VOTING_ENDED]: {
      label: t("eventStatus.votingEnded"),
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    [EventStatus.CONFIRMED]: {
      label: t("eventStatus.confirmed"),
      className:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    [EventStatus.COMPLETED]: {
      label: t("eventStatus.completed"),
      className:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

