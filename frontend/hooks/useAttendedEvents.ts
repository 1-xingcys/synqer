import { useQuery } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";

type AttendedEventsResponse =
  operations["EventCoreController_findAttendedEvents"]["responses"][200]["content"]["application/json"];
export type AttendedEventApiItem = AttendedEventsResponse[number];

const attendedEventsKeys = {
  all: ["attendedEvents"] as const,
};
export { attendedEventsKeys };

async function fetchAttendedEvents(): Promise<AttendedEventsResponse> {
  return apiFetchJson<AttendedEventsResponse>("/events/attended");
}

export function useAttendedEvents() {
  const query = useQuery({
    queryKey: attendedEventsKeys.all,
    queryFn: fetchAttendedEvents,
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
