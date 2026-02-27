"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useLineGroups,
  useLineGroupMembers,
  LineGroupMember,
} from "@/hooks/useLineGroups";
import { CircleHelp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LineGroupSectionProps {
  selectedGroupId: string | null;
  selectedMemberIds: string[];
  onGroupChange: (groupId: string | null) => void;
  onMembersChange: (memberIds: string[]) => void;
  onOpenInfo?: () => void;
}

export function LineGroupSection({
  selectedGroupId,
  selectedMemberIds,
  onGroupChange,
  onMembersChange,
  onOpenInfo,
}: LineGroupSectionProps) {
  const t = useTranslations();
  const { user } = useAuthContext();
  const { groups, loading: groupsLoading } = useLineGroups();
  const { members, loading: membersLoading } =
    useLineGroupMembers(selectedGroupId);

  // Check if user has LINE provider
  const isLineUser = user?.providers?.includes("line");

  // Filter out the current user from members list
  const filteredMembers = useMemo(() => {
    if (!members) return [];

    return members.filter((member) => {
      if (member.linkedUser?.id && user?.id) {
        return member.linkedUser.id.toString() !== user.id.toString();
      }
      return true;
    });
  }, [members, user]);

  // Sort members: registered first, then by name
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      if (a.isLinked && !b.isLinked) return -1;
      if (!a.isLinked && b.isLinked) return 1;
      const nameA = a.displayName || "";
      const nameB = b.displayName || "";
      return nameA.localeCompare(nameB);
    });
  }, [filteredMembers]);

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
    <div className="space-y-4">
      {/* LINE Group Dropdown */}
      <div className="space-y-1.5">
        <div className="flex items-center">
          <Label>{t("createEvent.lineGroup.selectGroup")}</Label>
          {onOpenInfo && (
            <button
              type="button"
              onClick={onOpenInfo}
              className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground"
              aria-label={t("createEvent.lineGroup.openDetailAriaLabel")}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={selectedGroupId ?? "none"}
          onValueChange={(value) =>
            onGroupChange(value === "none" ? null : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                groupsLoading
                  ? t("common.loading")
                  : t("createEvent.lineGroup.noGroupSelected")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("createEvent.lineGroup.noGroupSelected")}
            </SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.groupName || t("createEvent.lineGroup.unnamedGroup")} (
                {group.memberCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("createEvent.lineGroup.selectGroupHint")}
        </p>
      </div>

      {/* Members Selection */}
      {selectedGroupId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {t("createEvent.lineGroup.selectMembers")}
              {selectedMemberIds.length > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedMemberIds.length}{" "}
                  {t("createEvent.lineGroup.selected")})
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={selectAllMembers}
                className="h-auto p-0 text-xs"
              >
                {t("createEvent.lineGroup.selectAll")}
              </Button>
              {selectedMemberIds.length > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={clearAllMembers}
                  className="h-auto p-0 text-xs text-muted-foreground"
                >
                  {t("createEvent.lineGroup.clearAll")}
                </Button>
              )}
            </div>
          </div>

          {membersLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("createEvent.lineGroup.noMembers")}
            </div>
          ) : (
            <div className="border border-border rounded-md divide-y divide-border max-h-64 overflow-auto">
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
          <p className="text-xs text-muted-foreground">
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

  // Use a label wrapper to make the entire row clickable via the checkbox
  const checkboxId = `member-checkbox-${member.id}`;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5",
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={isSelected}
        onCheckedChange={onToggle}
      />

      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={member.pictureUrl || undefined}
          alt={member.displayName || "Member"}
        />
        <AvatarFallback>
          <Users className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {member.displayName || t("createEvent.lineGroup.unknownMember")}
        </div>
      </div>

      {/* Linked user indicator */}
      {!member.isLinked && (
        <StatusBadge
          variant="notRegistered"
          label={t("createEvent.lineGroup.notRegistered")}
        />
      )}
      {member.isLinked && member.linkedUser && (
        <StatusBadge
          variant="registered"
          label={t("createEvent.lineGroup.registered")}
        />
      )}
    </label>
  );
}
