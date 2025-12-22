"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParticipantsState } from "./useParticipantsState";
import { DesktopLayout, MobileLayout } from "./layouts";
import { useEffect } from "react";

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
    filteredLineGroupList,
    setSearchQuery,
    addMember,
    addUser,
    removeParticipant,
    addAllMembers,
    saveParticipants,
    isSelected,
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
