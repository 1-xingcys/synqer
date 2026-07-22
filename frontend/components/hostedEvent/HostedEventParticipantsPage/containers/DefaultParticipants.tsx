"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
import { Text } from "@/components/ui/text";
import { useDefaultParticipantsState } from "../hooks";
import { DefaultParticipantsView } from "../view";

export function DefaultParticipants() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
    eventLoading,
    searchResults,
    searchLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,
    hasUnsavedChanges,
    setSearchQuery,
    addUser,
    removeParticipant,
    saveParticipants,
    isSelected,
    isHost,
  } = useDefaultParticipantsState(eventId);

  if (eventLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Text variant="hint" align="center">
          {t("hosted.participantsPage.description")}
        </Text>
      </div>

      <DefaultParticipantsView
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onAddUser={addUser}
        isUserSelected={(userId: string) => isSelected(userId)}
        selectedParticipants={selectedParticipants}
        onRemoveParticipant={removeParticipant}
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={() => void saveParticipants()}
        isHost={isHost}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}
