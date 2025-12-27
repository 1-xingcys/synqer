"use client";

import { useTranslations } from "next-intl";
import {
  ParticipantRow,
  EmptyState,
  SectionSeparator,
  UnsavedChangesBadge,
  ActiveLayout,
} from "../components";
import { SelectedParticipant, ParticipantListItem } from "../types";
import { LineGroupMember } from "@/hooks/useLineGroups";

interface LineGroupViewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredLineGroupList: ParticipantListItem[];
  membersLoading: boolean;
  onAddMember: (member: LineGroupMember) => void;
  members: LineGroupMember[];
  selectedParticipants: SelectedParticipant[];
  onRemoveParticipant: (index: number) => void;
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  isHost: (userId?: string) => boolean;
  hasUnsavedChanges: boolean;
}

export function LineGroupView({
  searchQuery,
  onSearchChange,
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
}: LineGroupViewProps) {
  const t = useTranslations();

  // Show selected first, then unselected
  const selectedInGroup = filteredLineGroupList.filter(
    (item) => item.isSelected,
  );
  const unselectedInGroup = filteredLineGroupList.filter(
    (item) => !item.isSelected,
  );

  return (
    <ActiveLayout
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t("hosted.participantsPage.filterMembers")}
      selectedCount={selectedParticipants.length}
      saving={saving}
      saveSuccess={saveSuccess}
      onSave={onSave}
    >
      {membersLoading ? (
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
              {hasUnsavedChanges && <UnsavedChangesBadge />}
              <SectionSeparator label={t("hosted.participantsPage.selected")} />
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
      )}
    </ActiveLayout>
  );
}
