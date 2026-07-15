"use client";

import { useTranslations } from "next-intl";
import {
  Vote,
  Clock,
  CircleCheck,
  CalendarCheck,
  Calendar,
} from "lucide-react";
import { EventStatus } from "@/types/event";

type EmptyStateCategory = EventStatus | "all";

interface EmptyStateProps {
  category?: EmptyStateCategory;
  translationNamespace?: string;
}

export default function EmptyState({
  category = "all",
  translationNamespace = "joinedEvents",
}: EmptyStateProps) {
  const t = useTranslations(translationNamespace);

  const getIcon = () => {
    switch (category) {
      case EventStatus.VOTING:
        return <Vote className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
      case EventStatus.VOTING_ENDED:
        return <Clock className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
      case EventStatus.CONFIRMED:
        return (
          <CalendarCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        );
      case EventStatus.COMPLETED:
        return (
          <CircleCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        );
      default:
        return (
          <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        );
    }
  };

  const getMessage = () => {
    switch (category) {
      case EventStatus.VOTING:
        return {
          title: t("empty.voting"),
          description: t("empty.votingDescription"),
        };
      case EventStatus.VOTING_ENDED:
        return {
          title: t("empty.votingEnded"),
          description: t("empty.votingEndedDescription"),
        };
      case EventStatus.CONFIRMED:
        return {
          title: t("empty.confirmed"),
          description: t("empty.confirmedDescription"),
        };
      case EventStatus.COMPLETED:
        return {
          title: t("empty.completed"),
          description: t("empty.completedDescription"),
        };
      default:
        return {
          title: t("empty.all"),
          description: t("empty.allDescription"),
        };
    }
  };

  const { title, description } = getMessage();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
