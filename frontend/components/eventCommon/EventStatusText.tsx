"use client";

import { useTranslations } from "next-intl";
import { EventStatus } from "@/types/event";
import { eventStatusColor } from "./eventStatusStyles";

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
      className: eventStatusColor[EventStatus.VOTING],
    },
    [EventStatus.VOTING_ENDED]: {
      label: t("eventStatus.votingEnded"),
      className: eventStatusColor[EventStatus.VOTING_ENDED],
    },
    [EventStatus.CONFIRMED]: {
      label: t("eventStatus.confirmed"),
      className: eventStatusColor[EventStatus.CONFIRMED],
    },
    [EventStatus.COMPLETED]: {
      label: t("eventStatus.completed"),
      className: eventStatusColor[EventStatus.COMPLETED],
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`font-medium ${sizeClasses[size]} ${config.className}`}>
      {config.label}
    </span>
  );
}
