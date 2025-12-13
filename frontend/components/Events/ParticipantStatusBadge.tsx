"use client";

import { useTranslations } from "next-intl";
import { ParticipantStatus } from "@/types/event";

interface ParticipantStatusBadgeProps {
  status: ParticipantStatus;
  size?: "sm" | "md";
}

export function ParticipantStatusBadge({
  status,
  size = "sm",
}: ParticipantStatusBadgeProps) {
  const t = useTranslations();

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-0.5 text-xs",
  };

  const statusConfig: Record<
    ParticipantStatus,
    { label: string; className: string }
  > = {
    [ParticipantStatus.VOTED]: {
      label: t("participantStatus.voted"),
      className:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    },
    [ParticipantStatus.NOT_VOTED]: {
      label: t("participantStatus.notVoted"),
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    },
    [ParticipantStatus.NOT_REGISTERED]: {
      label: t("participantStatus.notRegistered"),
      className:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses[size]} ${config.className}`}
    >
      {config.label}
    </span>
  );
}

