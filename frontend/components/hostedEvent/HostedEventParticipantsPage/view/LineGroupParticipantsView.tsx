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

interface LineGroupParticipantsViewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredLineGroupList: ParticipantListItem[];
  membersLoading: boolean;
  onAddMember: (member: LineGroupMember) => void;
  members: LineGroupMember[];
  selectedParticipants: SelectedParticipant[];
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  isHost: (userId?: string) => boolean;
  hasUnsavedChanges: boolean;
  getRemoveHandler: (item: ParticipantListItem) => (() => void) | undefined;
}

export function LineGroupParticipantsView({
  searchQuery,
  onSearchChange,
  filteredLineGroupList,
  membersLoading,
  onAddMember,
  members,
  selectedParticipants,
  saving,
  saveSuccess,
  onSave,
  isHost,
  hasUnsavedChanges,
  getRemoveHandler,
}: LineGroupParticipantsViewProps) {
  const t = useTranslations();

  // Separate selected participants: from group vs joined via link
  const selectedFromGroup = filteredLineGroupList.filter(
    (item) => item.isSelected && item.isFromGroup,
  );
  const selectedViaLink = filteredLineGroupList.filter(
    (item) => item.isSelected && !item.isFromGroup,
  );
  // Unselected members (only group members can be added)
  const unselectedInGroup = filteredLineGroupList.filter(
    (item) => !item.isSelected && item.isFromGroup,
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
          {hasUnsavedChanges && <UnsavedChangesBadge />}

          {/* Selected Members from Group */}
          {selectedFromGroup.length > 0 && (
            <>
              <SectionSeparator label={t("hosted.participantsPage.selected")} />
              {selectedFromGroup.map((item) => {
                // Find the corresponding selected participant to get hasVoted
                const selectedP = selectedParticipants.find(
                  (p) =>
                    p.lineUserId === item.lineUserId ||
                    (item.userId && p.userId === item.userId),
                );
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
                    isHost={isHost(item.userId)}
                    onRemove={getRemoveHandler(item)}
                  />
                );
              })}
            </>
          )}

          {/* Selected Members via Link (not in group) */}
          {selectedViaLink.length > 0 && (
            <>
              <SectionSeparator
                label={t("hosted.participantsPage.joinedViaLink")}
              />
              {selectedViaLink.map((item) => (
                <ParticipantRow
                  key={item.id}
                  displayName={item.displayName}
                  pictureUrl={item.pictureUrl}
                  isSelected={true}
                  isRegistered={item.isRegistered}
                  hasVoted={item.hasVoted}
                  showStatus={true}
                  variant="selected"
                  isHost={isHost(item.userId)}
                  onRemove={getRemoveHandler(item)}
                />
              ))}
            </>
          )}

          {/* Unselected Members (only group members) */}
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
