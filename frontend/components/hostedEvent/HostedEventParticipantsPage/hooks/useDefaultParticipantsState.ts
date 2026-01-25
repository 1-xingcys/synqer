"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { useUserSearch, type SearchedUser } from "@/hooks/useUserSearch";
import { SelectedParticipant } from "../types";

export function useDefaultParticipantsState(eventId: string) {
  const {
    data: eventData,
    loading: eventLoading,
    refetch,
  } = useHostedEventContext();

  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clearResults,
  } = useUserSearch();

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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        void search(searchQuery);
      } else {
        clearResults();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search, clearResults]);

  // Check if a user is already selected
  const isSelected = useCallback(
    (userId?: string) => {
      return selectedParticipants.some((p) => userId && p.userId === userId);
    },
    [selectedParticipants],
  );

  // Add a searched user
  const addUser = useCallback(
    (user: SearchedUser) => {
      if (isSelected(user.id)) {
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

      // Clear search after adding
      setSearchQuery("");
      clearResults();
    },
    [isSelected, clearResults],
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
    searchResults,
    searchLoading,
    selectedParticipants,
    searchQuery,
    saving,
    saveSuccess,
    hasUnsavedChanges,
    setSearchQuery,
    addUser,
    removeParticipant,
    saveParticipants,
    isSelected,
    isHost,
  };
}
