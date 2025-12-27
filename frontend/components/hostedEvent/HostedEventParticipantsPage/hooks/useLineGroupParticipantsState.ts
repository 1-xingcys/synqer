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
    loading: eventLoading,
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
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/participants`,
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
      });
    });

    return list;
  }, [members, isSelected]);

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
    removeParticipant,
    addAllMembers,
    saveParticipants,
    isSelected,
    isHost,
  };
}
