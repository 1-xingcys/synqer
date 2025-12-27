"use client";

import { useMemo } from "react";
import { HostedEventDetailData } from "@/hooks/useHostedEventDetail";
import {
  Vote,
  Participant,
} from "@/components/eventCommon/timeGrid/ResultsView/types";

interface UseParticipantsDataReturn {
  participantsWithAvatars: Participant[];
  votesWithAvatars: Vote[];
  totalParticipants: number;
}

export function useParticipantsData(
  data: HostedEventDetailData | null,
): UseParticipantsDataReturn {
  // Transform participants to include avatar info for ResultsView
  const participantsWithAvatars = useMemo((): Participant[] => {
    if (!data) return [];

    return data.expectedParticipants.map((p) => ({
      userId: p.userId || p.id,
      displayName: p.displayName || "Unknown",
      pictureUrl: p.pictureUrl,
    }));
  }, [data]);

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
  const votesWithAvatars = useMemo((): Vote[] => {
    if (!data) return [];

    return data.votes.map((vote) => ({
      ...vote,
      pictureUrl: pictureUrlMap.get(vote.userId),
    }));
  }, [data, pictureUrlMap]);

  return {
    participantsWithAvatars,
    votesWithAvatars,
    totalParticipants: participantsWithAvatars.length,
  };
}
