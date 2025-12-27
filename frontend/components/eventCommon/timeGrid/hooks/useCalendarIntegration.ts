"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { CalendarEvent, TimeSlot } from "../types";
import { mapCalendarEventsToSlots } from "../utils";

interface UseCalendarIntegrationProps {
  eventId?: string;
  slots: TimeSlot[];
  slotsByDate: Record<string, TimeSlot[]>;
}

interface UseCalendarIntegrationReturn {
  // State
  calendarStatus: { connected: boolean; googleEmail?: string } | null;
  calendarLoading: boolean;
  calendarEvents: CalendarEvent[];
  conflictingSlotIds: string[];
  loadingCalendar: boolean;
  showCalendarOnGrid: boolean;

  // Computed
  calendarEventsForSlot: Map<string, CalendarEvent[]>;

  // Actions
  setShowCalendarOnGrid: React.Dispatch<React.SetStateAction<boolean>>;
  connectCalendar: () => void;
  disconnectCalendar: () => Promise<void>;
  loadCalendarConflicts: () => Promise<void>;
  isEventStartInSlot: (slotId: string, event: CalendarEvent) => boolean;
  getEventSpanFromSlot: (slotId: string, event: CalendarEvent) => number;
}

export function useCalendarIntegration({
  eventId,
  slots,
  slotsByDate,
}: UseCalendarIntegrationProps): UseCalendarIntegrationReturn {
  const {
    status: calendarStatus,
    loading: calendarLoading,
    connect: connectCalendar,
    disconnect: disconnectCalendar,
    getConflictingSlots,
  } = useGoogleCalendar();

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [conflictingSlotIds, setConflictingSlotIds] = useState<string[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showCalendarOnGrid, setShowCalendarOnGrid] = useState(true);

  // Map calendar events to slots
  const calendarEventsForSlot = useMemo(
    () => mapCalendarEventsToSlots(calendarEvents, slots),
    [calendarEvents, slots],
  );

  // Load calendar conflicts
  const loadCalendarConflicts = useCallback(async () => {
    if (!eventId || !calendarStatus?.connected) return;

    setLoadingCalendar(true);
    try {
      const result = await getConflictingSlots(eventId);
      if (result) {
        setCalendarEvents(result.calendarEvents);
        setConflictingSlotIds(result.conflictingSlotIds);
      }
    } catch (error) {
      console.error("Failed to load calendar conflicts:", error);
    } finally {
      setLoadingCalendar(false);
    }
  }, [eventId, calendarStatus?.connected, getConflictingSlots]);

  // Auto-load calendar conflicts when connected
  useEffect(() => {
    if (calendarStatus?.connected && eventId) {
      void loadCalendarConflicts();
    }
  }, [calendarStatus?.connected, eventId, loadCalendarConflicts]);

  // Check if this slot is the first occurrence of an event in its row
  const isEventStartInSlot = useCallback(
    (slotId: string, event: CalendarEvent): boolean => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return false;

      const dateKey = slot.date.split("T")[0];
      const daySlots = slotsByDate[dateKey] || [];

      for (const daySlot of daySlots) {
        const eventsInSlot = calendarEventsForSlot.get(daySlot.id) || [];
        if (eventsInSlot.some((e) => e.id === event.id)) {
          return daySlot.id === slotId;
        }
      }
      return false;
    },
    [slots, slotsByDate, calendarEventsForSlot],
  );

  // Calculate how many consecutive slots an event spans from this slot
  const getEventSpanFromSlot = useCallback(
    (slotId: string, event: CalendarEvent): number => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return 1;

      const dateKey = slot.date.split("T")[0];
      const daySlots = slotsByDate[dateKey] || [];
      const slotIndex = daySlots.findIndex((s) => s.id === slotId);
      if (slotIndex === -1) return 1;

      let span = 0;
      for (let i = slotIndex; i < daySlots.length; i++) {
        const eventsInSlot = calendarEventsForSlot.get(daySlots[i].id) || [];
        if (eventsInSlot.some((e) => e.id === event.id)) {
          span++;
        } else {
          break;
        }
      }
      return span;
    },
    [slots, slotsByDate, calendarEventsForSlot],
  );

  return {
    // State
    calendarStatus,
    calendarLoading,
    calendarEvents,
    conflictingSlotIds,
    loadingCalendar,
    showCalendarOnGrid,

    // Computed
    calendarEventsForSlot,

    // Actions
    setShowCalendarOnGrid,
    connectCalendar,
    disconnectCalendar,
    loadCalendarConflicts,
    isEventStartInSlot,
    getEventSpanFromSlot,
  };
}
