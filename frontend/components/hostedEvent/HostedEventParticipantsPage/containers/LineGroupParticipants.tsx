"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLineGroupParticipantsState } from "../hooks";
import { LineGroupParticipantsView } from "../view";

export function LineGroupParticipants() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
    eventLoading,
    members,
    membersLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,
    hasUnsavedChanges,
    filteredLineGroupList,
    setSearchQuery,
    addMember,
    removeParticipant,
    saveParticipants,
    isHost,
  } = useLineGroupParticipantsState(eventId);

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
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("hosted.participantsPage.title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("hosted.participantsPage.descriptionLineGroup")}
        </p>
      </div>

      <LineGroupParticipantsView
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredLineGroupList={filteredLineGroupList}
        membersLoading={membersLoading}
        onAddMember={addMember}
        members={members}
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
