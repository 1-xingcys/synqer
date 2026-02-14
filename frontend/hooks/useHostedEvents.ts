import { useQuery } from "@tanstack/react-query";
import { EventListItem } from "@/types/event";
import { HostedEventRowData } from "@/components/eventCommon/EventsOverview";
import { apiFetchJson } from "@/lib/apiClient";

// Extend the base event type with hosted-specific fields
export interface ExtendedHostedEvent extends EventListItem {
  expectedParticipantCount?: number;
  votedCount?: number;
}

const hostedEventsKeys = {
  all: ["hostedEvents"] as const,
};

async function fetchHostedEvents(): Promise<ExtendedHostedEvent[]> {
  return apiFetchJson<ExtendedHostedEvent[]>("/events/my");
}

export function useHostedEvents() {
  const query = useQuery({
    queryKey: hostedEventsKeys.all,
    queryFn: fetchHostedEvents,
  });

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}

// Convert ExtendedHostedEvent to HostedEventRowData
export function toHostedEventRowData(
  event: ExtendedHostedEvent,
): HostedEventRowData {
  return {
    ...event,
    expectedParticipantCount:
      event.expectedParticipantCount ?? event.participantCount,
    votedCount: event.votedCount ?? 0,
  };
}
