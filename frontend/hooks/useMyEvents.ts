import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/api/apiClient";
import type { operations } from "@/generated/openapi";
import {
  normalizeMyEventsResponse,
  type NormalizedEventLike,
} from "@/lib/event/event-normalizers";

type MyEventsResponse =
  operations["EventCoreController_findMyInvolvedEvents"]["responses"][200]["content"]["application/json"];
export type MyEventItem = NormalizedEventLike<MyEventsResponse[number]>;

const myEventsKeys = {
  all: ["myEvents"] as const,
};
export { myEventsKeys };

async function fetchMyEvents(): Promise<MyEventsResponse> {
  return apiFetchJson<MyEventsResponse>("/events/mine");
}

export function useMyEvents() {
  const query = useQuery({
    queryKey: myEventsKeys.all,
    queryFn: fetchMyEvents,
    select: normalizeMyEventsResponse,
    refetchOnMount: "always",
  });

  const refetch = async () => {
    await query.refetch();
  };

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch,
  };
}
