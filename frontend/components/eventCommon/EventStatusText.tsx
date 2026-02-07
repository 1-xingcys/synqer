"use client";

import { useTranslations } from "next-intl";
import { EventStatus } from "@/types/event";

interface EventStatusTextProps {
  status: EventStatus;
  size?: "sm" | "md";
}

export function EventStatusText({ status, size = "md" }: EventStatusTextProps) {
  const t = useTranslations();

  const sizeClasses = {
    sm: "text-xs",
    md: "text-xs sm:text-sm",
  };

  const statusConfig: Record<
    EventStatus,
    { label: string; className: string }
  > = {
    [EventStatus.VOTING]: {
      label: t("eventStatus.voting"),
      className: "text-blue-600 dark:text-blue-400",
    },
    [EventStatus.VOTING_ENDED]: {
      label: t("eventStatus.votingEnded"),
      className: "text-amber-600 dark:text-amber-400",
    },
    [EventStatus.CONFIRMED]: {
      label: t("eventStatus.confirmed"),
      className: "text-green-600 dark:text-green-400",
    },
    [EventStatus.COMPLETED]: {
      label: t("eventStatus.completed"),
      className: "text-zinc-500 dark:text-zinc-400",
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`font-medium ${sizeClasses[size]} ${config.className}`}>
      {config.label}
    </span>
  );
}
