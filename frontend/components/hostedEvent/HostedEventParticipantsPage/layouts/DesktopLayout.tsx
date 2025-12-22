"use client";

import { useTranslations } from "next-intl";
import {
  SearchInput,
  ParticipantRow,
  SaveButton,
  EmptyState,
} from "../components";
import { SelectedParticipant, ParticipantListItem, EventMode } from "../types";
import { SearchedUser } from "@/hooks/useUserSearch";
import { LineGroupMember } from "@/hooks/useLineGroups";

interface DesktopLayoutProps {
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
  onAddAllMembers: () => void;
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
}

export function DesktopLayout({
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
  onAddAllMembers,
  members,
  selectedParticipants,
  onRemoveParticipant,
  saving,
  saveSuccess,
  onSave,
  isHost,
}: DesktopLayoutProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Add Participants */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {eventMode === "lineGroup"
              ? t("hosted.participantsPage.addFromGroup")
              : t("hosted.participantsPage.searchUsers")}
          </h3>
        </div>

        <div className="p-6">
          {/* Search Input */}
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={
              eventMode === "lineGroup"
                ? t("hosted.participantsPage.filterMembers")
                : t("hosted.participantsPage.searchPlaceholder")
            }
          />

          {/* Add All Button (LINE group mode only) */}
          {eventMode === "lineGroup" && members.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={onAddAllMembers}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t("hosted.participantsPage.addAll")}
              </button>
            </div>
          )}

          {/* Results List */}
          <div className="mt-4 space-y-1 max-h-80 overflow-y-auto">
            {eventMode === "lineGroup" ? (
              // LINE Group Mode
              membersLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                  {t("common.loading")}
                </p>
              ) : filteredLineGroupList.length === 0 ? (
                <EmptyState type="noResults" />
              ) : (
                filteredLineGroupList.map((item) => (
                  <ParticipantRow
                    key={item.id}
                    displayName={item.displayName}
                    pictureUrl={item.pictureUrl}
                    isSelected={item.isSelected}
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
                ))
              )
            ) : (
              // Search Mode
              <>
                {searchLoading ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                    {t("common.loading")}
                  </p>
                ) : searchQuery.length < 2 ? (
                  <EmptyState type="searchHint" />
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
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Selected Participants */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t("hosted.participantsPage.selectedParticipants")}
          </h3>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ({selectedParticipants.length})
          </span>
        </div>

        <div className="p-6">
          {selectedParticipants.length === 0 ? (
            <EmptyState type="noParticipants" />
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
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
                    onRemove={
                      participantIsHost
                        ? undefined
                        : () => onRemoveParticipant(index)
                    }
                    isHost={participantIsHost}
                  />
                );
              })}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <SaveButton
              saving={saving}
              saveSuccess={saveSuccess}
              onClick={onSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
