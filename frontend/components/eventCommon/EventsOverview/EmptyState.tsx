"use client";

import { useTranslations } from "next-intl";
import { Vote, Clock, CheckCircle, CircleCheck, Calendar } from "lucide-react";
import { EventCategory } from "./EventRow";

type EmptyStateCategory = EventCategory | "all";

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
      case "voting":
        return <Vote className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
      case "votingEnded":
        return <Clock className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
      case "confirmed":
        return (
          <CheckCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
        );
      case "completed":
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
      case "voting":
        return {
          title: t("empty.voting"),
          description: t("empty.votingDescription"),
        };
      case "votingEnded":
        return {
          title: t("empty.votingEnded"),
          description: t("empty.votingEndedDescription"),
        };
      case "confirmed":
        return {
          title: t("empty.confirmed"),
          description: t("empty.confirmedDescription"),
        };
      case "completed":
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
