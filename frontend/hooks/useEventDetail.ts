import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/api/apiClient";
import type { operations } from "@/generated/openapi";
import { normalizeEventDetailResponse } from "@/lib/event/event-normalizers";

type RawEventDetailResponse =
  operations["EventCoreController_findOne"]["responses"][200]["content"]["application/json"];
export type EventDetailData = ReturnType<typeof normalizeEventDetailResponse>;

// Query key factory for event detail
export const eventDetailKeys = {
  all: ["eventDetail"] as const,
  detail: (eventId: string) => [...eventDetailKeys.all, eventId] as const,
};

// Fetch function
async function fetchEventDetail(
  eventId: string,
): Promise<RawEventDetailResponse> {
  return apiFetchJson<RawEventDetailResponse>(`/events/${eventId}`);
}

export function useEventDetail(eventId: string) {
  const query = useQuery({
    queryKey: eventDetailKeys.detail(eventId),
    queryFn: () => fetchEventDetail(eventId),
    select: normalizeEventDetailResponse,
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
