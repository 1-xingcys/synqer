import { useQuery } from "@tanstack/react-query";
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
  isDeleted: boolean;
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

// Query key factory for hosted event
export const hostedEventKeys = {
  all: ["hostedEvent"] as const,
  detail: (eventId: string) => [...hostedEventKeys.all, eventId] as const,
};

// Fetch function
async function fetchHostedEventDetail(
  eventId: string,
): Promise<HostedEventDetailData> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

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

  return response.json() as Promise<HostedEventDetailData>;
}

export function useHostedEventDetail(eventId: string) {
  const query = useQuery({
    queryKey: hostedEventKeys.detail(eventId),
    queryFn: () => fetchHostedEventDetail(eventId),
    enabled: !!eventId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
