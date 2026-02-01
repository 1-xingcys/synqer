import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  EventStatus,
  ConfirmedTimeRange,
  ParticipantStatus,
  VoteMode,
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
}

interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  hasVoted: boolean;
  reminderSentAt?: string;
  status?: ParticipantStatus;
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
  status: EventStatus;
  confirmedSlotIds: string[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  votingDeadline?: string;
  lineGroupId?: string;
}

export interface EventDetailData {
  isDeleted: boolean;
  event: Event;
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  expectedParticipants: ExpectedParticipant[];
}

// Query key factory for event detail
export const eventDetailKeys = {
  all: ["eventDetail"] as const,
  detail: (eventId: string) => [...eventDetailKeys.all, eventId] as const,
};

// Fetch function
async function fetchEventDetail(eventId: string): Promise<EventDetailData> {
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

  return response.json() as Promise<EventDetailData>;
}

// Save votes function
async function saveVotesApi(
  eventId: string,
  selectedSlotIds: string[],
  voteMode: VoteMode,
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/voting`,
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
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(errorData.message || "Failed to save votes");
  }
}

export function useEventDetail(eventId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: eventDetailKeys.detail(eventId),
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
  });

  const voteMutation = useMutation({
    mutationFn: ({
      selectedSlotIds,
      voteMode,
    }: {
      selectedSlotIds: string[];
      voteMode: VoteMode;
    }) => saveVotesApi(eventId, selectedSlotIds, voteMode),
    onSuccess: () => {
      // Invalidate and refetch
      void queryClient.invalidateQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const saveVotes = useCallback(
    async (
      selectedSlotIds: string[],
      voteMode: VoteMode = VoteMode.AVAILABLE,
    ) => {
      await voteMutation.mutateAsync({ selectedSlotIds, voteMode });
    },
    [voteMutation],
  );

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    saveVotes,
    refetch: query.refetch,
  };
}
