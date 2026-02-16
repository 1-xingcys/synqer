import { useQuery } from "@tanstack/react-query";
import { ExtendedAttendedEvent } from "./useFilteredAttendedEvents";
import { apiFetchJson } from "@/lib/apiClient";

const attendedEventsKeys = {
  all: ["attendedEvents"] as const,
};
export { attendedEventsKeys };

async function fetchAttendedEvents(): Promise<ExtendedAttendedEvent[]> {
  return apiFetchJson<ExtendedAttendedEvent[]>("/events/attended");
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
