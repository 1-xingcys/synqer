"use client";

import { useTranslations } from "next-intl";
import { EventStatus } from "@/types/event";

interface StatusDescriptionProps {
  status: EventStatus;
  className?: string;
}

export function StatusDescription({
  status,
  className = "",
}: StatusDescriptionProps) {
  const t = useTranslations();

  const statusDescriptions: Record<EventStatus, string> = {
    [EventStatus.VOTING]: t("eventInfo.statusDesc.voting"),
    [EventStatus.VOTING_ENDED]: t("eventInfo.statusDesc.votingEnded"),
    [EventStatus.CONFIRMED]: t("eventInfo.statusDesc.confirmed"),
    [EventStatus.COMPLETED]: t("eventInfo.statusDesc.completed"),
  };

  return (
    <p className={`text-xs text-zinc-500 dark:text-zinc-500 ${className}`}>
      {statusDescriptions[status]}
    </p>
  );
}
