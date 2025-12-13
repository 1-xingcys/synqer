import { useState, useEffect, useCallback } from "react";
import { EventListItem } from "@/types/event";

// 保留舊介面以便向後相容
export type MyEvent = EventListItem;

export function useMyEvents() {
  const [events, setEvents] = useState<EventListItem[]>([]);
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
        throw new Error("Failed to fetch events");
      }

      const data = (await response.json()) as EventListItem[];
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
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
