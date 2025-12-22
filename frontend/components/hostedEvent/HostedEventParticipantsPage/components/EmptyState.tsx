"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyStateProps {
  type: "noParticipants" | "noResults" | "searchHint";
}

export function EmptyState({ type }: EmptyStateProps) {
  const t = useTranslations();

  const content = {
    noParticipants: {
      title: t("hosted.participantsPage.noParticipants"),
      description: t("hosted.participantsPage.addParticipantsHint"),
    },
    noResults: {
      title: t("hosted.participantsPage.noResults"),
      description: "",
    },
    searchHint: {
      title: t("hosted.participantsPage.searchHint"),
      description: "",
    },
  };

  const { title, description } = content[type];

  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      {description && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
