"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { CalendarEvent, TimeSlot } from "../../types";
import { mapCalendarEventsToSlots } from "../../utils";

interface UseCalendarConflictSyncApiProps {
  eventId?: string;
  slots: TimeSlot[];
  enabled: boolean;
}

interface UseCalendarConflictSyncApiReturn {
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
}

/**
 * 統一管理 Google Calendar 衝突同步：
 * 負責連線狀態、衝突資料抓取，並提供格子層需要的事件映射資料。
 */
export function useCalendarConflictSyncApi({
  eventId,
  slots,
  enabled,
}: UseCalendarConflictSyncApiProps): UseCalendarConflictSyncApiReturn {
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
    if (!enabled || !eventId || !calendarStatus?.connected) return;

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
  }, [enabled, eventId, calendarStatus?.connected, getConflictingSlots]);

  // Auto-load calendar conflicts when connected
  useEffect(() => {
    if (enabled && calendarStatus?.connected && eventId) {
      void loadCalendarConflicts();
    }
  }, [enabled, calendarStatus?.connected, eventId, loadCalendarConflicts]);

  useEffect(() => {
    if (enabled) return;
    setCalendarEvents([]);
    setConflictingSlotIds([]);
    setShowCalendarOnGrid(false);
  }, [enabled]);

  return {
    // State
    calendarStatus,
    calendarLoading,
    calendarEvents,
    conflictingSlotIds,
    loadingCalendar,
    showCalendarOnGrid: enabled ? showCalendarOnGrid : false,

    // Computed
    calendarEventsForSlot,

    // Actions
    setShowCalendarOnGrid,
    connectCalendar,
    disconnectCalendar,
  };
}
