"use client";

import { useMemo, useCallback } from "react";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { SelectedParticipant } from "../types";

export function useReadOnlyParticipantsState() {
  const { data: eventData, isLoading: eventLoading } = useHostedEventContext();

  // Derive selected participants from event data (no useState needed for read-only)
  const selectedParticipants = useMemo<SelectedParticipant[]>(() => {
    if (!eventData?.expectedParticipants) return [];
    return eventData.expectedParticipants.map((p) => ({
      id: p.id,
      lineUserId: p.lineUserId,
      userId: p.userId,
      displayName: p.displayName || "Unknown",
      pictureUrl: p.pictureUrl,
      hasVoted: p.hasVoted,
    }));
  }, [eventData]);

  // Get host userId
  const hostUserId = eventData?.event.ownerId;

  // Check if a participant is the host
  const isHost = useCallback(
    (userId?: string): boolean => {
      return !!(hostUserId && userId === hostUserId);
    },
    [hostUserId],
  );

  return {
    eventData,
    eventLoading,
    selectedParticipants,
    isHost,
  };
}
