import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/openapi";

type EventInfoResponse =
  operations["EventCoreController_getEventInfo"]["responses"][200]["content"]["application/json"];
export type EventInfoData = EventInfoResponse;
export type ExpectedParticipant = EventInfoData["expectedParticipants"][number];
export type EventHost = EventInfoData["host"];

// Query key factory for event info
export const eventInfoKeys = {
  all: ["eventInfo"] as const,
  detail: (eventId: string) => [...eventInfoKeys.all, eventId] as const,
};

// Fetch function
async function fetchEventInfo(eventId: string): Promise<EventInfoResponse> {
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

  return response.json() as Promise<EventInfoResponse>;
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
