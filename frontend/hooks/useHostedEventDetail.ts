import { useState, useEffect, useCallback } from "react";
import {
  EventStatus,
  ParticipantStatus,
  ConfirmedTimeRange,
} from "@/types/event";

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
  hasVoted: boolean;
}

interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted: boolean;
  status: ParticipantStatus;
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
  ownerId?: string;
  lineGroupId?: string;
  votingDeadline?: string;
  confirmedSlotIds: string[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  status: EventStatus;
}

export interface HostedEventDetailData {
  event: Event;
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  expectedParticipants: ExpectedParticipant[];
  votingStats: {
    totalExpected: number;
    totalVoted: number;
    votingPercentage: number;
  };
}

export function useHostedEventDetail(eventId: string) {
  const [data, setData] = useState<HostedEventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventData = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/hosted`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You are not the owner of this event");
        }
        throw new Error("Failed to fetch event data");
      }

      const eventData = (await response.json()) as HostedEventDetailData;
      setData(eventData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchEventData();
  }, [fetchEventData]);

  return {
    data,
    loading,
    error,
    refetch: fetchEventData,
  };
}
