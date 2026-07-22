"use client";

import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
import { Text } from "@/components/ui/text";
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
        <Text variant="hint" align="center">
          {t("hosted.participantsPage.votingEndedDescription")}
        </Text>
      </div>

      {/* Read-only participant list */}
      <ReadOnlyParticipantsView
        selectedParticipants={selectedParticipants}
        isHost={isHost}
      />
    </div>
  );
}
