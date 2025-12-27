import { useState, useEffect, useCallback } from "react";
import { EventListItem } from "@/types/event";
import { HostedEventRowData } from "@/components/eventCommon/EventsOverview";

// Extend the base event type with hosted-specific fields
export interface ExtendedHostedEvent extends EventListItem {
  expectedParticipantCount?: number;
  votedCount?: number;
}

export function useHostedEvents() {
  const [events, setEvents] = useState<ExtendedHostedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/events/my`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch hosted events");
      }

      const data = (await response.json()) as ExtendedHostedEvent[];
      setEvents(data);
      setError(null);
    } catch {
      setError("Failed to load hosted events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
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
