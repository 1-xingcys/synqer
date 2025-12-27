import { useState, useEffect, useCallback } from "react";
import { AttendedEventListItem } from "@/types/event";
import { ExtendedAttendedEvent } from "./useFilteredAttendedEvents";

// 保留舊介面以便向後相容
export type AttendedEvent = AttendedEventListItem;

export function useAttendedEvents() {
  const [events, setEvents] = useState<ExtendedAttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/attended`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attended events");
      }

      const data = (await response.json()) as ExtendedAttendedEvent[];
      setEvents(data);
      setError(null);
    } catch {
      setError("Failed to load attended events");
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
