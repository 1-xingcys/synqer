import { useState, useEffect, useCallback } from "react";

export interface AttendedEvent {
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  participantCount: number;
}

export function useAttendedEvents() {
  const [events, setEvents] = useState<AttendedEvent[]>([]);
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

      const data = (await response.json()) as AttendedEvent[];
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching attended events:", err);
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
