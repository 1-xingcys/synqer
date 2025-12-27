"use client";

import { useTranslations } from "next-intl";
import {
  ParticipantRow,
  EmptyState,
  SectionSeparator,
  UnsavedChangesBadge,
  ActiveLayout,
} from "../components";
import { SelectedParticipant } from "../types";
import { SearchedUser } from "@/hooks/useUserSearch";

interface SearchLayoutProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchedUser[];
  searchLoading: boolean;
  onAddUser: (user: SearchedUser) => void;
  isUserSelected: (userId: string) => boolean;
  selectedParticipants: SelectedParticipant[];
  onRemoveParticipant: (index: number) => void;
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  isHost: (userId?: string) => boolean;
  hasUnsavedChanges: boolean;
}

export function SearchLayout({
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onAddUser,
  isUserSelected,
  selectedParticipants,
  onRemoveParticipant,
  saving,
  saveSuccess,
  onSave,
  isHost,
  hasUnsavedChanges,
}: SearchLayoutProps) {
  const t = useTranslations();

  const isSearching = searchQuery.length >= 2;

  return (
    <ActiveLayout
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t("hosted.participantsPage.searchPlaceholder")}
      selectedCount={selectedParticipants.length}
      saving={saving}
      saveSuccess={saveSuccess}
      onSave={onSave}
    >
      <div className="p-2">
        {isSearching ? (
          // Show search results
          searchLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
              {t("common.loading")}
            </p>
          ) : searchResults.length === 0 ? (
            <EmptyState type="noResults" />
          ) : (
            searchResults.map((user) => (
              <ParticipantRow
                key={user.id}
                displayName={user.displayName || user.primaryEmail || "Unknown"}
                pictureUrl={user.avatarUrl}
                isSelected={isUserSelected(user.id)}
                variant="add"
                onAdd={() => onAddUser(user)}
              />
            ))
          )
        ) : (
          // Show selected participants when not searching
          <>
            {selectedParticipants.length === 0 ? (
              <EmptyState type="noParticipants" />
            ) : (
              <>
                {hasUnsavedChanges && <UnsavedChangesBadge />}
                <SectionSeparator
                  label={t("hosted.participantsPage.selected")}
                />
                {selectedParticipants.map((participant, index) => {
                  const participantIsHost = isHost(participant.userId);
                  return (
                    <ParticipantRow
                      key={`${participant.lineUserId || participant.userId || index}`}
                      displayName={participant.displayName}
                      pictureUrl={participant.pictureUrl}
                      isSelected={true}
                      isRegistered={!!participant.userId}
                      hasVoted={participant.hasVoted}
                      showStatus={true}
                      variant="selected"
                      isHost={participantIsHost}
                      onRemove={
                        participantIsHost
                          ? undefined
                          : () => onRemoveParticipant(index)
                      }
                    />
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </ActiveLayout>
  );
}
