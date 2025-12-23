"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParticipantsState } from "./useParticipantsState";
import { DesktopLayout, MobileLayout } from "./layouts";
import { useEffect } from "react";
import { EventStatus } from "@/types/event";
import Image from "next/image";

export default function HostedEventParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

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
    addAllMembers,
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
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("hosted.participantsPage.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("hosted.participantsPage.votingEndedDescription")}
          </p>
        </div>

        {/* Read-only participant list */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hosted.participantsPage.participants")}
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({selectedParticipants.length})
            </span>
          </div>

          <div className="p-6">
            {selectedParticipants.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                {t("hosted.participantsPage.noParticipants")}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedParticipants.map((participant, index) => (
                  <div
                    key={`${participant.lineUserId || participant.userId || index}`}
                    className="flex items-center gap-3 p-2 rounded-lg"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                      {participant.pictureUrl ? (
                        <Image
                          width={40}
                          height={40}
                          src={participant.pictureUrl}
                          alt={participant.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {participant.displayName}
                        {isHost(participant.userId) && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            ({t("hosted.participantsPage.host")})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Voted status */}
                    {participant.hasVoted && (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        {t("hosted.participantsPage.voted")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const commonProps = {
    eventMode,
    searchQuery,
    onSearchChange: setSearchQuery,
    searchResults,
    searchLoading,
    onAddUser: addUser,
    isUserSelected: (userId: string) => isSelected(undefined, userId),
    filteredLineGroupList,
    membersLoading,
    onAddMember: addMember,
    members,
    selectedParticipants,
    onRemoveParticipant: removeParticipant,
    saving,
    saveSuccess,
    onSave: () => void saveParticipants(),
    isHost,
    hasUnsavedChanges,
  };

  return (
    <div className="space-y-6">
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

      {/* Layout */}
      {isDesktop ? (
        <DesktopLayout {...commonProps} onAddAllMembers={addAllMembers} />
      ) : (
        <MobileLayout {...commonProps} />
      )}
    </div>
  );
}
