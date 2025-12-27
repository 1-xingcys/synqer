"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useParticipantsState } from "./useParticipantsState";
import { LineGroupView, SearchView, ReadOnlyView } from "./view";
import { useEffect } from "react";
import { EventStatus } from "@/types/event";

export default function HostedEventParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
    eventData,
    eventLoading,
    eventMode,
    members,
    membersLoading,
    searchResults,
    searchLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,
    hasUnsavedChanges,
    filteredLineGroupList,
    setSearchQuery,
    addMember,
    addUser,
    removeParticipant,
    saveParticipants,
    isSelected,
    isHost,
  } = useParticipantsState(eventId);

  useEffect(() => {
    console.log("selectedParticipants", selectedParticipants);
  }, [selectedParticipants]);

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">{t("event.notFound")}</p>
      </div>
    );
  }

  // Check if voting is no longer allowed (vote ended, confirmed, complete)
  const isVotingDisabled =
    eventData.event.status === EventStatus.VOTING_ENDED ||
    eventData.event.status === EventStatus.CONFIRMED ||
    eventData.event.status === EventStatus.COMPLETED;

  // If voting is disabled, show read-only view
  if (isVotingDisabled) {
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
        <ReadOnlyView
          selectedParticipants={selectedParticipants}
          isHost={isHost}
        />
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
          {eventMode === "lineGroup"
            ? t("hosted.participantsPage.descriptionLineGroup")
            : t("hosted.participantsPage.description")}
        </p>
      </div>

      {eventMode === "lineGroup" ? (
        <LineGroupView
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
      ) : (
        <SearchView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onAddUser={addUser}
          isUserSelected={(userId: string) => isSelected(undefined, userId)}
          selectedParticipants={selectedParticipants}
          onRemoveParticipant={removeParticipant}
          saving={saving}
          saveSuccess={saveSuccess}
          onSave={() => void saveParticipants()}
          isHost={isHost}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
    </div>
  );
}
