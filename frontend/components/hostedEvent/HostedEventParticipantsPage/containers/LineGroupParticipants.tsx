"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/ui/loading-state";
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
    saveParticipants,
    isHost,
    getRemoveHandler,
  } = useLineGroupParticipantsState(eventId);

  if (eventLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-1">
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
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={() => void saveParticipants()}
        isHost={isHost}
        hasUnsavedChanges={hasUnsavedChanges}
        getRemoveHandler={getRemoveHandler}
      />
    </div>
  );
}
