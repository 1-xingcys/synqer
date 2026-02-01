"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import {
  useLineGroupMembers,
  type LineGroupMember,
} from "@/hooks/useLineGroups";
import { SelectedParticipant, ParticipantListItem } from "../types";

export function useLineGroupParticipantsState(eventId: string) {
  const {
    data: eventData,
    isLoading: eventLoading,
    refetch,
  } = useHostedEventContext();

  const lineGroupId = eventData?.event.lineGroupId || null;

  const { members, loading: membersLoading } = useLineGroupMembers(lineGroupId);

  const [selectedParticipants, setSelectedParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [initialParticipants, setInitialParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize selected participants from event data
  useEffect(() => {
    if (eventData?.expectedParticipants) {
      const participants = eventData.expectedParticipants.map((p) => ({
        id: p.id,
        lineUserId: p.lineUserId,
        userId: p.userId,
        displayName: p.displayName || "Unknown",
        pictureUrl: p.pictureUrl,
        hasVoted: p.hasVoted,
        status: p.status,
      }));
      setSelectedParticipants(participants);
      setInitialParticipants(participants);
    }
  }, [eventData]);

  // Check if a member/user is already selected
  const isSelected = useCallback(
    (lineUserId?: string, userId?: string) => {
      return selectedParticipants.some(
        (p) =>
          (lineUserId && p.lineUserId === lineUserId) ||
          (userId && p.userId === userId),
      );
    },
    [selectedParticipants],
  );

  // Add a LINE group member
  const addMember = useCallback(
    (member: LineGroupMember) => {
      if (isSelected(member.lineUserId, member.linkedUser?.id)) {
        return;
      }

      setSelectedParticipants((prev) => [
        ...prev,
        {
          lineUserId: member.lineUserId,
          userId: member.linkedUser?.id,
          displayName:
            member.linkedUser?.displayName || member.displayName || "Unknown",
          pictureUrl: member.linkedUser?.avatarUrl || member.pictureUrl,
        },
      ]);
    },
    [isSelected],
  );

  // Get host userId
  const hostUserId = eventData?.event.ownerId;

  // Check if a participant is the host
  const isHost = useCallback(
    (userId?: string): boolean => {
      return !!(hostUserId && userId === hostUserId);
    },
    [hostUserId],
  );

  // Remove a participant (cannot remove host)
  const removeParticipant = useCallback(
    (index: number) => {
      setSelectedParticipants((prev) => {
        const participant = prev[index];
        // Cannot remove host
        if (participant?.userId && isHost(participant.userId)) {
          return prev;
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    [isHost],
  );

  // Add all members from group
  const addAllMembers = useCallback(() => {
    const newParticipants: SelectedParticipant[] = [];
    members.forEach((member) => {
      if (!isSelected(member.lineUserId, member.linkedUser?.id)) {
        newParticipants.push({
          lineUserId: member.lineUserId,
          userId: member.linkedUser?.id,
          displayName:
            member.linkedUser?.displayName || member.displayName || "Unknown",
          pictureUrl: member.linkedUser?.avatarUrl || member.pictureUrl,
        });
      }
    });
    setSelectedParticipants((prev) => [...prev, ...newParticipants]);
  }, [members, isSelected]);

  // Save participants
  const saveParticipants = useCallback(async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/participation/members`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            participants: selectedParticipants.map((p) => ({
              lineUserId: p.lineUserId,
              userId: p.userId,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save participants");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      console.error("Failed to save participants:", error);
    } finally {
      setSaving(false);
    }
  }, [eventId, selectedParticipants, refetch]);

  // Build participant list for LINE group mode
  const lineGroupParticipantList = useMemo((): ParticipantListItem[] => {
    const list: ParticipantListItem[] = [];

    // Track which selected participants are from the group
    const includedParticipantKeys = new Set<string>();

    // Add all members with selection status
    members.forEach((member) => {
      const selected = isSelected(member.lineUserId, member.linkedUser?.id);
      list.push({
        id: member.id,
        lineUserId: member.lineUserId,
        userId: member.linkedUser?.id,
        displayName:
          member.linkedUser?.displayName || member.displayName || "Unknown",
        pictureUrl: member.linkedUser?.avatarUrl || member.pictureUrl,
        isSelected: selected,
        isRegistered: member.isLinked,
        isFromGroup: true,
      });

      // Track this member as included
      if (member.lineUserId) {
        includedParticipantKeys.add(`line:${member.lineUserId}`);
      }
      if (member.linkedUser?.id) {
        includedParticipantKeys.add(`user:${member.linkedUser.id}`);
      }
    });

    // Add selected participants who are NOT in the group (joined via link)
    selectedParticipants.forEach((participant) => {
      const isIncluded =
        (participant.lineUserId &&
          includedParticipantKeys.has(`line:${participant.lineUserId}`)) ||
        (participant.userId &&
          includedParticipantKeys.has(`user:${participant.userId}`));

      if (!isIncluded) {
        list.push({
          id:
            participant.id ||
            `external-${participant.lineUserId || participant.userId}`,
          lineUserId: participant.lineUserId,
          userId: participant.userId,
          displayName: participant.displayName,
          pictureUrl: participant.pictureUrl,
          isSelected: true,
          isRegistered: !!participant.userId, // Has userId means registered
          hasVoted: participant.hasVoted,
          isFromGroup: false,
        });
      }
    });

    return list;
  }, [members, isSelected, selectedParticipants]);

  // Filter list based on search query
  const filteredLineGroupList = useMemo(() => {
    if (!searchQuery.trim()) return lineGroupParticipantList;

    const query = searchQuery.toLowerCase();
    return lineGroupParticipantList.filter((p) =>
      p.displayName.toLowerCase().includes(query),
    );
  }, [lineGroupParticipantList, searchQuery]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (selectedParticipants.length !== initialParticipants.length) {
      return true;
    }
    // Compare by lineUserId and userId
    const initialSet = new Set(
      initialParticipants.map((p) => `${p.lineUserId || ""}-${p.userId || ""}`),
    );
    return selectedParticipants.some(
      (p) => !initialSet.has(`${p.lineUserId || ""}-${p.userId || ""}`),
    );
  }, [selectedParticipants, initialParticipants]);

  // Get remove handler for a participant (returns undefined if host)
  const getRemoveHandler = useCallback(
    (item: ParticipantListItem) => {
      if (isHost(item.userId)) return undefined;
      return () => {
        const idx = selectedParticipants.findIndex(
          (p) =>
            p.lineUserId === item.lineUserId ||
            (item.userId && p.userId === item.userId),
        );
        if (idx !== -1) removeParticipant(idx);
      };
    },
    [isHost, selectedParticipants, removeParticipant],
  );

  return {
    eventData,
    eventLoading,
    members,
    membersLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,
    hasUnsavedChanges,
    filteredLineGroupList,
    setSearchQuery,
    addMember,
    addAllMembers,
    saveParticipants,
    isSelected,
    isHost,
    getRemoveHandler,
  };
}
