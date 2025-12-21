"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useLineGroups,
  useLineGroupMembers,
  LineGroupMember,
} from "@/hooks/useLineGroups";
import { ChevronDownIcon, Users, Check, UserPlus, X } from "lucide-react";

interface LineGroupSectionProps {
  selectedGroupId: string | null;
  selectedMemberIds: string[];
  onGroupChange: (groupId: string | null) => void;
  onMembersChange: (memberIds: string[]) => void;
}

export function LineGroupSection({
  selectedGroupId,
  selectedMemberIds,
  onGroupChange,
  onMembersChange,
}: LineGroupSectionProps) {
  const t = useTranslations();
  const { user } = useAuthContext();
  const { groups, loading: groupsLoading } = useLineGroups();
  const { members, loading: membersLoading } = useLineGroupMembers(
    selectedGroupId,
  );
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Check if user has LINE provider
  const isLineUser = user?.providers?.includes("line");

  // Filter out the current user from members list
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    // Get current user's LINE user ID if available
    // We need to filter by linkedUser.id matching current user.id
    return members.filter((member) => {
      // If member is linked to current user, exclude them
      if (member.linkedUser?.id && user?.id) {
        return member.linkedUser.id.toString() !== user.id.toString();
      }
      return true;
    });
  }, [members, user]);

  // Sort members: registered first, then by name
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      // Registered users first
      if (a.isLinked && !b.isLinked) return -1;
      if (!a.isLinked && b.isLinked) return 1;
      // Then by name
      const nameA = a.displayName || "";
      const nameB = b.displayName || "";
      return nameA.localeCompare(nameB);
    });
  }, [filteredMembers]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Toggle member selection
  const toggleMember = (lineUserId: string) => {
    if (selectedMemberIds.includes(lineUserId)) {
      onMembersChange(selectedMemberIds.filter((id) => id !== lineUserId));
    } else {
      onMembersChange([...selectedMemberIds, lineUserId]);
    }
  };

  // Select all members
  const selectAllMembers = () => {
    const allMemberIds = sortedMembers.map((m) => m.lineUserId);
    onMembersChange(allMemberIds);
  };

  // Clear all selections
  const clearAllMembers = () => {
    onMembersChange([]);
  };

  // Don't show for non-LINE users
  if (!isLineUser) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
      {/* LINE Group Dropdown */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
          {t("createEvent.lineGroup.selectGroup")}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>
                {groupsLoading
                  ? t("common.loading")
                  : selectedGroup
                    ? selectedGroup.groupName ||
                      t("createEvent.lineGroup.unnamedGroup")
                    : t("createEvent.lineGroup.noGroupSelected")}
              </span>
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 opacity-50 transition-transform ${isGroupDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isGroupDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
              {/* No group option */}
              <button
                type="button"
                onClick={() => {
                  onGroupChange(null);
                  setIsGroupDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 ${
                  !selectedGroupId
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-zinc-300"
                }`}
              >
                <span>{t("createEvent.lineGroup.noGroupSelected")}</span>
              </button>

              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    onGroupChange(group.id);
                    setIsGroupDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center justify-between ${
                    selectedGroupId === group.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <span>
                    {group.groupName ||
                      t("createEvent.lineGroup.unnamedGroup")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                    {group.memberCount} {t("createEvent.lineGroup.members")}
                  </span>
                </button>
              ))}

              {groups.length === 0 && !groupsLoading && (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-zinc-400 text-center">
                  {t("createEvent.lineGroup.noGroups")}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
          {t("createEvent.lineGroup.selectGroupHint")}
        </p>
      </div>

      {/* Members Selection */}
      {selectedGroupId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300">
              {t("createEvent.lineGroup.selectMembers")}
              {selectedMemberIds.length > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({selectedMemberIds.length}{" "}
                  {t("createEvent.lineGroup.selected")})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllMembers}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t("createEvent.lineGroup.selectAll")}
              </button>
              {selectedMemberIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllMembers}
                  className="text-xs text-gray-500 dark:text-zinc-400 hover:underline"
                >
                  {t("createEvent.lineGroup.clearAll")}
                </button>
              )}
            </div>
          </div>

          {membersLoading ? (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-zinc-400">
              {t("common.loading")}
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-zinc-400">
              {t("createEvent.lineGroup.noMembers")}
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-zinc-700 rounded-md divide-y divide-gray-200 dark:divide-zinc-700 max-h-64 overflow-auto">
              {sortedMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelected={selectedMemberIds.includes(member.lineUserId)}
                  onToggle={() => toggleMember(member.lineUserId)}
                />
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {t("createEvent.lineGroup.selectMembersHint")}
          </p>
        </div>
      )}
    </div>
  );
}

// Member row component
function MemberRow({
  member,
  isSelected,
  onToggle,
}: {
  member: LineGroupMember;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations();

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/10" : ""
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
            : "border-gray-300 dark:border-zinc-600"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Avatar */}
      {member.pictureUrl ? (
        <img
          src={member.pictureUrl}
          alt={member.displayName || "Member"}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
          <Users className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
        </div>
      )}

      {/* Name and status */}
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
          {member.displayName || t("createEvent.lineGroup.unknownMember")}
        </div>
        {!member.isLinked && (
          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            {t("createEvent.lineGroup.notRegistered")}
          </div>
        )}
      </div>

      {/* Linked user indicator */}
      {member.isLinked && member.linkedUser && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
            {t("createEvent.lineGroup.registered")}
          </span>
        </div>
      )}
    </button>
  );
}

