"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyParticipantsState } from "../hooks";
import { ReadOnlyParticipantsView } from "../view";

export function ReadOnlyParticipants() {
  const t = useTranslations();
  const { eventLoading, selectedParticipants, isHost } =
    useReadOnlyParticipantsState();

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("hosted.participantsPage.title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("hosted.participantsPage.votingEndedDescription")}
        </p>
      </div>

      {/* Read-only participant list */}
      <ReadOnlyParticipantsView
        selectedParticipants={selectedParticipants}
        isHost={isHost}
      />
    </div>
  );
}
