"use client";

import { useTranslations } from "next-intl";
import {
  SearchInput,
  ParticipantRow,
  SaveButton,
  EmptyState,
  SectionSeparator,
} from "../components";
import { SelectedParticipant, ParticipantListItem, EventMode } from "../types";
import { SearchedUser } from "@/hooks/useUserSearch";
import { LineGroupMember } from "@/hooks/useLineGroups";

interface MobileLayoutProps {
  eventMode: EventMode;
  // Search mode props
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchedUser[];
  searchLoading: boolean;
  onAddUser: (user: SearchedUser) => void;
  isUserSelected: (userId: string) => boolean;
  // LINE group mode props
  filteredLineGroupList: ParticipantListItem[];
  membersLoading: boolean;
  onAddMember: (member: LineGroupMember) => void;
  members: LineGroupMember[];
  // Selected participants
  selectedParticipants: SelectedParticipant[];
  onRemoveParticipant: (index: number) => void;
  // Save
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  // Host protection
  isHost: (userId?: string) => boolean;
  // Unsaved changes
  hasUnsavedChanges: boolean;
}

export function MobileLayout({
  eventMode,
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onAddUser,
  isUserSelected,
  filteredLineGroupList,
  membersLoading,
  onAddMember,
  members,
  selectedParticipants,
  onRemoveParticipant,
  saving,
  saveSuccess,
  onSave,
  isHost,
  hasUnsavedChanges,
}: MobileLayoutProps) {
  const t = useTranslations();

  // For LINE group mode: show selected first, then unselected
  const selectedInGroup = filteredLineGroupList.filter(
    (item) => item.isSelected,
  );
  const unselectedInGroup = filteredLineGroupList.filter(
    (item) => !item.isSelected,
  );

  // For search mode: show selected participants when not searching
  const isSearching = searchQuery.length >= 2;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Search Input - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={
            eventMode === "lineGroup"
              ? t("hosted.participantsPage.filterMembers")
              : t("hosted.participantsPage.searchPlaceholder")
          }
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {t("hosted.participantsPage.selectedCount", {
              count: selectedParticipants.length,
            })}
          </span>
        </div>
      </div>

      {/* List Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {eventMode === "lineGroup" ? (
          // LINE Group Mode - Instagram style
          membersLoading ? (
            <div className="p-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                {t("common.loading")}
              </p>
            </div>
          ) : filteredLineGroupList.length === 0 ? (
            <div className="p-4">
              <EmptyState type="noResults" />
            </div>
          ) : (
            <div className="p-2">
              {/* Selected Members */}
              {selectedInGroup.length > 0 && (
                <>
                  {hasUnsavedChanges && (
                    <div className="mb-2 px-2">
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        {t("hosted.participantsPage.unsavedChanges")}
                      </span>
                    </div>
                  )}
                  <SectionSeparator
                    label={t("hosted.participantsPage.selected")}
                  />
                  {selectedInGroup.map((item) => {
                    // Find the corresponding selected participant to get hasVoted
                    const selectedP = selectedParticipants.find(
                      (p) =>
                        p.lineUserId === item.lineUserId ||
                        (item.userId && p.userId === item.userId),
                    );
                    const participantIsHost = isHost(item.userId);
                    return (
                      <ParticipantRow
                        key={item.id}
                        displayName={item.displayName}
                        pictureUrl={item.pictureUrl}
                        isSelected={true}
                        isRegistered={item.isRegistered}
                        hasVoted={selectedP?.hasVoted}
                        showStatus={true}
                        variant="selected"
                        isHost={participantIsHost}
                        onRemove={
                          participantIsHost
                            ? undefined
                            : () => {
                                const idx = selectedParticipants.findIndex(
                                  (p) =>
                                    p.lineUserId === item.lineUserId ||
                                    (item.userId && p.userId === item.userId),
                                );
                                if (idx !== -1) onRemoveParticipant(idx);
                              }
                        }
                      />
                    );
                  })}
                </>
              )}

              {/* Unselected Members */}
              {unselectedInGroup.length > 0 && (
                <>
                  <SectionSeparator
                    label={t("hosted.participantsPage.notSelected")}
                  />
                  {unselectedInGroup.map((item) => (
                    <ParticipantRow
                      key={item.id}
                      displayName={item.displayName}
                      pictureUrl={item.pictureUrl}
                      isSelected={false}
                      isRegistered={item.isRegistered}
                      showStatus={!item.isRegistered}
                      variant="toggle"
                      onAdd={() => {
                        const member = members.find(
                          (m) => m.lineUserId === item.lineUserId,
                        );
                        if (member) onAddMember(member);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          )
        ) : (
          // Search Mode
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
                    displayName={
                      user.displayName || user.primaryEmail || "Unknown"
                    }
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
                    {hasUnsavedChanges && (
                      <div className="mb-2 px-2">
                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                          {t("hosted.participantsPage.unsavedChanges")}
                        </span>
                      </div>
                    )}
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
        )}
      </div>

      {/* Save Button - Sticky Bottom */}
      <div className="sticky bottom-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <SaveButton
          saving={saving}
          saveSuccess={saveSuccess}
          onClick={onSave}
        />
      </div>
    </div>
  );
}
