"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import {
  useLineGroupMembers,
  type LineGroupMember,
} from "@/hooks/useLineGroups";
import { useUserSearch, type SearchedUser } from "@/hooks/useUserSearch";
import { SelectedParticipant, EventMode, ParticipantListItem } from "./types";

export function useParticipantsState(eventId: string) {
  const {
    data: eventData,
    loading: eventLoading,
    refetch,
  } = useHostedEventDetail(eventId);

  // Determine mode based on event's lineGroupId
  const eventMode: EventMode = eventData?.event.lineGroupId
    ? "lineGroup"
    : "search";
  const lineGroupId = eventData?.event.lineGroupId || null;

  const { members, loading: membersLoading } = useLineGroupMembers(lineGroupId);
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clearResults,
  } = useUserSearch();

  const [selectedParticipants, setSelectedParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize selected participants from event data
  useEffect(() => {
    if (eventData?.expectedParticipants) {
      setSelectedParticipants(
        eventData.expectedParticipants.map((p) => ({
          id: p.id,
          lineUserId: p.lineUserId,
          userId: p.userId,
          displayName: p.displayName || "Unknown",
          pictureUrl: p.pictureUrl,
          hasVoted: p.hasVoted,
          status: p.status,
        })),
      );
    }
  }, [eventData]);

  // Debounced search for search mode
  useEffect(() => {
    if (eventMode !== "search") return;

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        void search(searchQuery);
      } else {
        clearResults();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search, clearResults, eventMode]);

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

  // Add a searched user
  const addUser = useCallback(
    (user: SearchedUser) => {
      if (isSelected(undefined, user.id)) {
        return;
      }

      setSelectedParticipants((prev) => [
        ...prev,
        {
          userId: user.id,
          displayName: user.displayName || user.primaryEmail || "Unknown",
          pictureUrl: user.avatarUrl,
        },
      ]);

      // Clear search after adding in search mode
      setSearchQuery("");
      clearResults();
    },
    [isSelected, clearResults],
  );

  // Remove a participant
  const removeParticipant = useCallback((index: number) => {
    setSelectedParticipants((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
    if (eventMode !== "lineGroup") return [];

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
  }, [eventMode, members, isSelected]);

  // Filter list based on search query (for LINE group mode)
  const filteredLineGroupList = useMemo(() => {
    if (!searchQuery.trim()) return lineGroupParticipantList;

    const query = searchQuery.toLowerCase();
    return lineGroupParticipantList.filter((p) =>
      p.displayName.toLowerCase().includes(query),
    );
  }, [lineGroupParticipantList, searchQuery]);

  return {
    // State
    eventData,
    eventLoading,
    eventMode,
    lineGroupId,
    members,
    membersLoading,
    searchResults,
    searchLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,

    // Computed
    filteredLineGroupList,

    // Actions
    setSearchQuery,
    addMember,
    addUser,
    removeParticipant,
    addAllMembers,
    saveParticipants,
    isSelected,
  };
}
