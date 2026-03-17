import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";
import {
  normalizeHostedEventsResponse,
  type NormalizedEventLike,
} from "@/lib/event-normalizers";

type HostedEventsResponse =
  operations["EventCoreController_findMyEvents"]["responses"][200]["content"]["application/json"];
export type HostedEventApiItem = NormalizedEventLike<
  HostedEventsResponse[number]
>;

const hostedEventsKeys = {
  all: ["hostedEvents"] as const,
};
export { hostedEventsKeys };

async function fetchHostedEvents(): Promise<HostedEventsResponse> {
  return apiFetchJson<HostedEventsResponse>("/events/my");
}

export function useHostedEvents() {
  const query = useQuery({
    queryKey: hostedEventsKeys.all,
    queryFn: fetchHostedEvents,
    select: normalizeHostedEventsResponse,
    refetchOnMount: "always",
  });

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
