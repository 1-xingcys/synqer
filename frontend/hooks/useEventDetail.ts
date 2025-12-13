import { useState, useEffect, useCallback } from "react";
import type { VoteMode } from "@/components/Events/VotingGrid";

interface TimeSlot {
  id: string;
  eventId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  index: number;
}

interface Vote {
  slotId: string;
  userId: string;
  userDisplayName: string;
}

interface Participant {
  userId: string;
  displayName: string;
}

interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  hasVoted: boolean;
  reminderSentAt?: string;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
  lineGroupMember?: {
    displayName?: string;
    pictureUrl?: string;
  };
}

interface Event {
  id: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
  timeZone: string;
}

export interface EventDetailData {
  event: Event;
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  expectedParticipants: ExpectedParticipant[];
}

export function useEventDetail(eventId: string) {
  const [data, setData] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventData = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const eventData = (await response.json()) as EventDetailData;
      setData(eventData);
    } catch (err) {
      console.error("載入活動失敗:", err);
      setError("載入活動失敗");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchEventData();
  }, [fetchEventData]);

  const saveVotes = async (selectedSlotIds: string[], voteMode: VoteMode = "available") => {
    if (!process.env.NEXT_PUBLIC_API) {
      throw new Error("NEXT_PUBLIC_API is not set");
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/events/${eventId}/votes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ selectedSlotIds, voteMode }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to save votes");
    }

    // 重新載入資料以更新 heatmap
    void fetchEventData();
  };

  return {
    data,
    loading,
    error,
    saveVotes,
    refetch: fetchEventData,
  };
}
