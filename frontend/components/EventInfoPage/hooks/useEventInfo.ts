import { useQuery } from "@tanstack/react-query";
import {
  EventStatus,
  ParticipantStatus,
  ConfirmedTimeRange,
} from "@/types/event";

interface ExpectedParticipant {
  id: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted: boolean;
  status: ParticipantStatus;
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface EventHost {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface EventInfoData {
  isDeleted: boolean;
  event: {
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
    createdAt: string;
  };
  host: EventHost | null;
  expectedParticipants: ExpectedParticipant[];
  currentUserHasVoted: boolean;
}

// Query key factory for event info
export const eventInfoKeys = {
  all: ["eventInfo"] as const,
  detail: (eventId: string) => [...eventInfoKeys.all, eventId] as const,
};

// Fetch function
async function fetchEventInfo(eventId: string): Promise<EventInfoData> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/info`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch event info");
  }

  return response.json() as Promise<EventInfoData>;
}

export function useEventInfo(eventId: string) {
  const query = useQuery({
    queryKey: eventInfoKeys.detail(eventId),
    queryFn: () => fetchEventInfo(eventId),
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

export type { EventInfoData, ExpectedParticipant, EventHost };
