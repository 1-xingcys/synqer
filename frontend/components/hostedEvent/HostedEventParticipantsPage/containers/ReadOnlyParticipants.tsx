"use client";

import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
import { useReadOnlyParticipantsState } from "../hooks";
import { ReadOnlyParticipantsView } from "../view";

export function ReadOnlyParticipants() {
  const t = useTranslations();
  const { eventLoading, selectedParticipants, isHost } =
    useReadOnlyParticipantsState();

  if (eventLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="max-w-xl mx-auto">
        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-1">
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
