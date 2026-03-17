import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/openapi";
import { normalizeHostedEventDetailResponse } from "@/lib/event-normalizers";

type RawHostedEventDetailResponse =
  operations["EventCoreController_findOneHosted"]["responses"][200]["content"]["application/json"];
export type HostedEventDetailData = ReturnType<
  typeof normalizeHostedEventDetailResponse
>;

// Query key factory for hosted event
export const hostedEventKeys = {
  all: ["hostedEvent"] as const,
  detail: (eventId: string) => [...hostedEventKeys.all, eventId] as const,
};

// Fetch function
async function fetchHostedEventDetail(
  eventId: string,
): Promise<RawHostedEventDetailResponse> {
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

  return response.json() as Promise<RawHostedEventDetailResponse>;
}

export function useHostedEventDetail(eventId: string) {
  const query = useQuery({
    queryKey: hostedEventKeys.detail(eventId),
    queryFn: () => fetchHostedEventDetail(eventId),
    select: normalizeHostedEventDetailResponse,
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
