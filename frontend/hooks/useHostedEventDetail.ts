import { useQuery } from "@tanstack/react-query";
import { ApiError, apiFetchJson } from "@/lib/apiClient";
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
  try {
    return await apiFetchJson<RawHostedEventDetailResponse>(
      `/events/${eventId}/hosted`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new Error("You are not the owner of this event");
    }
    throw error;
  }
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
