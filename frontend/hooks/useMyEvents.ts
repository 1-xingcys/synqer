import { useState, useEffect, useCallback } from "react";

export interface MyEvent {
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  participantCount: number;
}

export function useMyEvents() {
  const [events, setEvents] = useState<MyEvent[]>([]);
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

      const data = (await response.json()) as MyEvent[];
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
