"use client";

import { useMemo } from "react";
import { useEventDetail, EventDetailData } from "@/hooks/useEventDetail";

export interface ParticipantWithAvatar {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface VoteWithAvatar {
  slotId: string;
  userId: string;
  userDisplayName: string;
  pictureUrl?: string;
}

export interface UseJoinedEventResultsResult {
  data: EventDetailData | null;
  isLoading: boolean;
  error: string | null;
  participantsWithAvatars: ParticipantWithAvatar[];
  votesWithAvatars: VoteWithAvatar[];
}

export function useJoinedEventResults(
  eventId: string,
): UseJoinedEventResultsResult {
  const { data: eventDetailData, isLoading, error } = useEventDetail(eventId);

  // Transform participants to include avatar info
  const participantsWithAvatars = useMemo(() => {
    if (!eventDetailData) return [];

    return eventDetailData.expectedParticipants.map((p) => ({
      userId: p.userId || p.user?.id || p.id,
      displayName:
        p.user?.displayName || p.lineGroupMember?.displayName || "Unknown",
      pictureUrl: p.user?.avatarUrl || p.lineGroupMember?.pictureUrl,
    }));
  }, [eventDetailData]);

  // Create a mapping of userId to pictureUrl for votes
  const pictureUrlMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    participantsWithAvatars.forEach((p) => {
      if (p.userId) {
        map.set(p.userId, p.pictureUrl);
      }
    });
    return map;
  }, [participantsWithAvatars]);

  // Transform votes to include avatar info
  const votesWithAvatars = useMemo(() => {
    if (!eventDetailData) return [];

    return eventDetailData.votes.map((vote) => ({
      ...vote,
      pictureUrl: pictureUrlMap.get(vote.userId),
    }));
  }, [eventDetailData, pictureUrlMap]);

  return {
    data: eventDetailData,
    isLoading,
    error,
    participantsWithAvatars,
    votesWithAvatars,
  };
}
