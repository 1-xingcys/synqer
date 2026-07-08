"use client";

import { useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { SelectedParticipant } from "../types";

export function useReadOnlyParticipantsState() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { data: eventData, isLoading: eventLoading } =
    useHostedEventDetail(eventId);

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
