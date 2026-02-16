import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/openapi";

type HostedEventDetailResponse =
  operations["EventCoreController_findOneHosted"]["responses"][200]["content"]["application/json"];
export type HostedEventDetailData = HostedEventDetailResponse;

// Query key factory for hosted event
export const hostedEventKeys = {
  all: ["hostedEvent"] as const,
  detail: (eventId: string) => [...hostedEventKeys.all, eventId] as const,
};

// Fetch function
async function fetchHostedEventDetail(
  eventId: string,
): Promise<HostedEventDetailResponse> {
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

  return response.json() as Promise<HostedEventDetailResponse>;
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
