"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

interface TimeSlot {
  id: string;
  date: string;
  startMinute: number;
  endMinute: number;
  index: number;
}

interface Vote {
  slotId: string;
  userId: string;
  userDisplayName: string;
}

interface Participant {
  userId: string;
  displayName: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
}

export type VoteMode = "available" | "unavailable";

interface VotingGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  onSave: (selectedSlotIds: string[], voteMode: VoteMode) => Promise<void>;
  initialSelectedIds?: string[];
  currentUserId?: string;
  eventId?: string; // 用於取得 Calendar 衝突
}

interface GridPosition {
  dateIndex: number;
  timeIndex: number;
}

export default function VotingGrid({
  slots,
  votes,
  onSave,
  initialSelectedIds = [],
  currentUserId,
  eventId,
}: VotingGridProps) {
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [saving, setSaving] = useState(false);
  const [hasSubmittedVote, setHasSubmittedVote] = useState(initialSelectedIds.length > 0);
  
  // Vote mode state: "available" = 投自己可以的時間, "unavailable" = 投自己不行的時間
  const [voteMode, setVoteMode] = useState<VoteMode>("available");
  
  // Rectangle selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<GridPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<GridPosition | null>(null);
  const [baseSelection, setBaseSelection] = useState<Set<string>>(new Set(initialSelectedIds));
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [longPressSlot, setLongPressSlot] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Google Calendar integration
  const { status: calendarStatus, loading: calendarLoading, connect: connectCalendar, getConflictingSlots } = useGoogleCalendar();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [conflictingSlotIds, setConflictingSlotIds] = useState<string[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);

  // Create a map of votes by slot for quick lookup
  const votesBySlot = useMemo(() => votes.reduce(
    (acc, vote) => {
      if (!acc[vote.slotId]) acc[vote.slotId] = [];
      acc[vote.slotId].push(vote);
      return acc;
    },
    {} as Record<string, Vote[]>
  ), [votes]);

  // Group slots by date
  const slotsByDate = useMemo(() => slots.reduce(
    (acc, slot) => {
      const dateKey = slot.date.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  ), [slots]);

  const dates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const timeSlots = useMemo(() => dates.length > 0 ? slotsByDate[dates[0]] : [], [dates, slotsByDate]);

  // Create a 2D grid map for quick position lookups
  const slotGrid = useMemo(() => {
    const grid: string[][] = [];
    timeSlots.forEach((_, timeIndex) => {
      grid[timeIndex] = [];
      dates.forEach((dateKey, dateIndex) => {
        const slot = slotsByDate[dateKey][timeIndex];
        if (slot) {
          grid[timeIndex][dateIndex] = slot.id;
        }
      });
    });
    return grid;
  }, [dates, timeSlots, slotsByDate]);

  // Get slot position from slotId
  const getSlotPosition = useCallback((slotId: string): GridPosition | null => {
    for (let timeIndex = 0; timeIndex < slotGrid.length; timeIndex++) {
      for (let dateIndex = 0; dateIndex < slotGrid[timeIndex].length; dateIndex++) {
        if (slotGrid[timeIndex][dateIndex] === slotId) {
          return { dateIndex, timeIndex };
        }
      }
    }
    return null;
  }, [slotGrid]);

  // Get slots within rectangle
  const getSlotsInRectangle = useCallback((start: GridPosition, end: GridPosition): Set<string> => {
    const minDate = Math.min(start.dateIndex, end.dateIndex);
    const maxDate = Math.max(start.dateIndex, end.dateIndex);
    const minTime = Math.min(start.timeIndex, end.timeIndex);
    const maxTime = Math.max(start.timeIndex, end.timeIndex);

    const result = new Set<string>();
    for (let t = minTime; t <= maxTime; t++) {
      for (let d = minDate; d <= maxDate; d++) {
        const slotId = slotGrid[t]?.[d];
        if (slotId) {
          result.add(slotId);
        }
      }
    }
    return result;
  }, [slotGrid]);

  // Calculate preview selection (with negation)
  const previewSelection = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      return selectedSlots;
    }

    const rectangleSlots = getSlotsInRectangle(dragStart, dragEnd);
    const newSelection = new Set(baseSelection);

    // Apply negation: toggle each slot in the rectangle
    rectangleSlots.forEach((slotId) => {
      if (baseSelection.has(slotId)) {
        newSelection.delete(slotId);
      } else {
        newSelection.add(slotId);
      }
    });

    return newSelection;
  }, [isDragging, dragStart, dragEnd, baseSelection, getSlotsInRectangle, selectedSlots]);

  // Check if slot is in current rectangle
  const isSlotInRectangle = useCallback((slotId: string): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const rectangleSlots = getSlotsInRectangle(dragStart, dragEnd);
    return rectangleSlots.has(slotId);
  }, [isDragging, dragStart, dragEnd, getSlotsInRectangle]);

  // Format helpers
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: "short" });
    return { weekday, day, month };
  };

  // Selection handlers
  const selectEntireDay = useCallback(
    (dateKey: string) => {
      const daySlots = slotsByDate[dateKey] || [];
      const allSelected = daySlots.every((slot) => selectedSlots.has(slot.id));

      setSelectedSlots((prev) => {
        const newSelected = new Set(prev);
        daySlots.forEach((slot) => {
          if (allSelected) {
            newSelected.delete(slot.id);
          } else {
            newSelected.add(slot.id);
          }
        });
        return newSelected;
      });
      setBaseSelection((prev) => {
        const newSelected = new Set(prev);
        daySlots.forEach((slot) => {
          if (allSelected) {
            newSelected.delete(slot.id);
          } else {
            newSelected.add(slot.id);
          }
        });
        return newSelected;
      });
    },
    [slotsByDate, selectedSlots]
  );

  // Mouse handlers for rectangle selection
  const handleMouseDown = useCallback(
    (slotId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const position = getSlotPosition(slotId);
      if (position) {
        setIsDragging(true);
        setDragStart(position);
        setDragEnd(position);
        setBaseSelection(new Set(selectedSlots));
      }
    },
    [getSlotPosition, selectedSlots]
  );

  const handleMouseEnter = useCallback(
    (slotId: string) => {
      setHoveredSlot(slotId);
      if (isDragging) {
        const position = getSlotPosition(slotId);
        if (position) {
          setDragEnd(position);
        }
      }
    },
    [isDragging, getSlotPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Apply the preview selection
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, previewSelection]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (slotId: string, e: React.TouchEvent) => {
      // Start long press timer for showing voters
      longPressTimer.current = setTimeout(() => {
        setLongPressSlot(slotId);
      }, 500);

      const position = getSlotPosition(slotId);
      if (position) {
        setIsDragging(true);
        setDragStart(position);
        setDragEnd(position);
        setBaseSelection(new Set(selectedSlots));
      }
    },
    [getSlotPosition, selectedSlots]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!isDragging) return;

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotId = element?.getAttribute("data-slot-id");

      if (slotId) {
        const position = getSlotPosition(slotId);
        if (position) {
          setDragEnd(position);
        }
      }
    },
    [isDragging, getSlotPosition]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging && dragStart && dragEnd) {
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => setLongPressSlot(null), 100);
  }, [isDragging, dragStart, dragEnd, previewSelection]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        setSelectedSlots(previewSelection);
        setBaseSelection(previewSelection);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd, previewSelection]);

  // Load calendar conflicts when connected and eventId is available
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
    if (calendarStatus?.connected && eventId && showCalendarPanel) {
      loadCalendarConflicts();
    }
  }, [calendarStatus?.connected, eventId, showCalendarPanel, loadCalendarConflicts]);

  // Mark all conflicting slots
  const markConflictsAsUnavailable = useCallback(() => {
    if (voteMode === "unavailable") {
      // 如果是投「不行」的模式，直接選中所有衝突時段
      setSelectedSlots((prev) => {
        const newSelection = new Set(prev);
        conflictingSlotIds.forEach((id) => newSelection.add(id));
        return newSelection;
      });
      setBaseSelection((prev) => {
        const newSelection = new Set(prev);
        conflictingSlotIds.forEach((id) => newSelection.add(id));
        return newSelection;
      });
    } else {
      // 如果是投「可以」的模式，移除所有衝突時段
      setSelectedSlots((prev) => {
        const newSelection = new Set(prev);
        conflictingSlotIds.forEach((id) => newSelection.delete(id));
        return newSelection;
      });
      setBaseSelection((prev) => {
        const newSelection = new Set(prev);
        conflictingSlotIds.forEach((id) => newSelection.delete(id));
        return newSelection;
      });
    }
  }, [voteMode, conflictingSlotIds]);

  // Format calendar event time
  const formatEventTime = (event: CalendarEvent) => {
    if (event.isAllDay) {
      return tJoined("googleCalendar.allDay");
    }
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const formatTime = (d: Date) => 
      `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Map calendar events to slots for visual display
  const calendarEventsForSlot = useMemo(() => {
    if (!calendarEvents.length || !slots.length) return new Map<string, CalendarEvent[]>();
    
    const eventMap = new Map<string, CalendarEvent[]>();
    
    for (const slot of slots) {
      const slotDate = new Date(slot.date);
      const slotStart = new Date(slotDate);
      slotStart.setHours(0, 0, 0, 0);
      slotStart.setMinutes(slot.startMinute);
      
      const slotEnd = new Date(slotDate);
      slotEnd.setHours(0, 0, 0, 0);
      slotEnd.setMinutes(slot.endMinute);
      
      const overlappingEvents: CalendarEvent[] = [];
      
      for (const event of calendarEvents) {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Check for overlap
        if (slotStart < eventEnd && slotEnd > eventStart) {
          overlappingEvents.push(event);
        }
      }
      
      if (overlappingEvents.length > 0) {
        eventMap.set(slot.id, overlappingEvents);
      }
    }
    
    return eventMap;
  }, [calendarEvents, slots]);

  // Check if this slot is the first occurrence of an event in its row (date column)
  const isEventStartInSlot = useCallback((slotId: string, event: CalendarEvent): boolean => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return false;
    
    const dateKey = slot.date.split("T")[0];
    const daySlots = slotsByDate[dateKey] || [];
    
    // Find the first slot in this day that contains this event
    for (const daySlot of daySlots) {
      const eventsInSlot = calendarEventsForSlot.get(daySlot.id) || [];
      if (eventsInSlot.some(e => e.id === event.id)) {
        return daySlot.id === slotId;
      }
    }
    return false;
  }, [slots, slotsByDate, calendarEventsForSlot]);

  // Calculate how many consecutive slots an event spans from this slot
  const getEventSpanFromSlot = useCallback((slotId: string, event: CalendarEvent): number => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return 1;
    
    const dateKey = slot.date.split("T")[0];
    const daySlots = slotsByDate[dateKey] || [];
    const slotIndex = daySlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return 1;
    
    let span = 0;
    for (let i = slotIndex; i < daySlots.length; i++) {
      const eventsInSlot = calendarEventsForSlot.get(daySlots[i].id) || [];
      if (eventsInSlot.some(e => e.id === event.id)) {
        span++;
      } else {
        break;
      }
    }
    return span;
  }, [slots, slotsByDate, calendarEventsForSlot]);

  // Toggle to show/hide calendar events on grid
  const [showCalendarOnGrid, setShowCalendarOnGrid] = useState(true);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedSlots), voteMode);
      setHasSubmittedVote(true);
    } catch (error) {
      console.error("Save error:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  // Handle vote mode change
  const handleVoteModeChange = (newMode: VoteMode) => {
    if (newMode !== voteMode) {
      setVoteMode(newMode);
      // Clear selection when switching modes
      setSelectedSlots(new Set());
      setBaseSelection(new Set());
    }
  };

  // Get voters for a slot (for tooltip)
  const getVotersForSlot = (slotId: string): string[] => {
    return (votesBySlot[slotId] || []).map((v) => v.userDisplayName);
  };

  // Check if a day is fully selected
  const isDayFullySelected = (dateKey: string) => {
    const daySlots = slotsByDate[dateKey] || [];
    const checkSet = isDragging ? previewSelection : selectedSlots;
    return daySlots.length > 0 && daySlots.every((slot) => checkSet.has(slot.id));
  };

  // Get rectangle bounds for visual overlay
  const getRectangleBounds = useCallback(() => {
    if (!dragStart || !dragEnd) return null;
    return {
      minDate: Math.min(dragStart.dateIndex, dragEnd.dateIndex),
      maxDate: Math.max(dragStart.dateIndex, dragEnd.dateIndex),
      minTime: Math.min(dragStart.timeIndex, dragEnd.timeIndex),
      maxTime: Math.max(dragStart.timeIndex, dragEnd.timeIndex),
    };
  }, [dragStart, dragEnd]);

  const rectangleBounds = getRectangleBounds();

  // Determine the display selection (preview while dragging, actual otherwise)
  const displaySelection = isDragging ? previewSelection : selectedSlots;

  return (
    <div className="space-y-4">
      {/* Header with voting status and save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
            {voteMode === "available" ? tJoined("selectAvailableMode") : tJoined("selectUnavailableMode")}
          </h2>
          {/* Voting status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              hasSubmittedVote
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            {hasSubmittedVote ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {tJoined("voted")}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {tJoined("notVoted")}
              </>
            )}
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
        >
          {saving ? t("saving") : hasSubmittedVote ? tJoined("updateVote") : tJoined("voteNow")}
        </button>
      </div>

      {/* Vote Mode Toggle */}
      <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            {tJoined("voteModeLabel")}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Available mode button */}
            <button
              onClick={() => handleVoteModeChange("available")}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                voteMode === "available"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  voteMode === "available"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div
                  className={`font-medium ${
                    voteMode === "available"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  {tJoined("voteModeAvailable")}
                </div>
                <div className="text-xs text-gray-500 dark:text-zinc-400">
                  {tJoined("voteModeAvailableDesc")}
                </div>
              </div>
              {voteMode === "available" && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>

            {/* Unavailable mode button */}
            <button
              onClick={() => handleVoteModeChange("unavailable")}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                voteMode === "unavailable"
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                  : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  voteMode === "unavailable"
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div
                  className={`font-medium ${
                    voteMode === "unavailable"
                      ? "text-rose-700 dark:text-rose-400"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  {tJoined("voteModeUnavailable")}
                </div>
                <div className="text-xs text-gray-500 dark:text-zinc-400">
                  {tJoined("voteModeUnavailableDesc")}
                </div>
              </div>
              {voteMode === "unavailable" && (
                <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Google Calendar Integration */}
      {eventId && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800/80 dark:to-zinc-800/50 rounded-xl border border-blue-100 dark:border-zinc-700">
          {/* Header - always visible */}
          <button
            onClick={() => setShowCalendarPanel(!showCalendarPanel)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              {/* Google Calendar Icon */}
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4285F4" strokeWidth="2"/>
                  <path d="M3 9H21" stroke="#4285F4" strokeWidth="2"/>
                  <path d="M9 4V7" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M15 4V7" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="7" y="12" width="3" height="3" rx="0.5" fill="#EA4335"/>
                  <rect x="11" y="12" width="3" height="3" rx="0.5" fill="#FBBC05"/>
                  <rect x="7" y="16" width="3" height="2" rx="0.5" fill="#34A853"/>
                  <rect x="11" y="16" width="3" height="2" rx="0.5" fill="#4285F4"/>
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-zinc-100">
                  {tJoined("googleCalendar.title")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {calendarStatus?.connected 
                    ? tJoined("googleCalendar.connectedAs", { email: calendarStatus.googleEmail || "" })
                    : tJoined("googleCalendar.connectHint")
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection status badge */}
              {!calendarLoading && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  calendarStatus?.connected
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}>
                  {calendarStatus?.connected ? tJoined("googleCalendar.connected") : tJoined("googleCalendar.notConnected")}
                </span>
              )}
              {/* Expand/collapse icon */}
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${showCalendarPanel ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Expanded panel */}
          {showCalendarPanel && (
            <div className="px-4 pb-4 space-y-4 border-t border-blue-100 dark:border-zinc-700 pt-4">
              {/* Not connected - show connect button */}
              {!calendarStatus?.connected && (
                <button
                  onClick={() => connectCalendar()}
                  disabled={calendarLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-zinc-300">
                    {tJoined("googleCalendar.connect")}
                  </span>
                </button>
              )}

              {/* Connected - show calendar events and conflicts */}
              {calendarStatus?.connected && (
                <>
                  {/* Loading state */}
                  {loadingCalendar && (
                    <div className="flex items-center justify-center py-4">
                      <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">
                        {tJoined("googleCalendar.importing")}
                      </span>
                    </div>
                  )}

                  {/* Conflicts found */}
                  {!loadingCalendar && conflictingSlotIds.length > 0 && (
                    <div className="space-y-3">
                      {/* Toggle to show calendar on grid */}
                      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-zinc-300">
                            {tJoined("googleCalendar.showOnGrid")}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowCalendarOnGrid(!showCalendarOnGrid)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            showCalendarOnGrid ? "bg-orange-500" : "bg-gray-300 dark:bg-zinc-600"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              showCalendarOnGrid ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {tJoined("googleCalendar.conflictsFound", { count: conflictingSlotIds.length })}
                        </p>
                        <button
                          onClick={markConflictsAsUnavailable}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {tJoined("googleCalendar.markAsUnavailable")}
                        </button>
                      </div>

                      {/* Calendar events list */}
                      {calendarEvents.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                          {calendarEvents.map((event, idx) => {
                            const colors = [
                              "bg-orange-400",
                              "bg-purple-400",
                              "bg-blue-400",
                              "bg-pink-400",
                            ];
                            return (
                              <div key={event.id} className="px-3 py-2 flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length]} mt-1.5 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                    {event.summary}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {formatEventTime(event)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No conflicts */}
                  {!loadingCalendar && conflictingSlotIds.length === 0 && calendarEvents.length === 0 && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {tJoined("googleCalendar.noConflicts")}
                      </p>
                    </div>
                  )}

                  {/* Refresh button */}
                  {!loadingCalendar && (
                    <button
                      onClick={loadCalendarConflicts}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {tJoined("googleCalendar.import")}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        {voteMode === "available" ? tJoined("dragToSelectAvailable") : tJoined("dragToSelectUnavailable")}
      </p>

      {/* Selection info bar */}
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
        <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
          {tJoined("selectedSlots", { count: displaySelection.size })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedSlots(new Set());
              setBaseSelection(new Set());
            }}
            className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            {tJoined("clearSelection")}
          </button>
          <span className="text-gray-300 dark:text-zinc-600">|</span>
          <button
            onClick={() => {
              const allSlots = new Set(slots.map((s) => s.id));
              setSelectedSlots(allSlots);
              setBaseSelection(allSlots);
            }}
            className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            {tJoined("selectAll")}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="overflow-x-auto select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <div className="min-w-fit relative">
          {/* Date headers */}
          <div className="flex">
            {/* Time column header */}
            <div className="w-20 shrink-0" />
            {/* Date columns */}
            {dates.map((dateKey) => {
              const { weekday, day, month } = formatDateHeader(dateKey);
              const isFullySelected = isDayFullySelected(dateKey);
              return (
                <button
                  key={dateKey}
                  onClick={() => selectEntireDay(dateKey)}
                  className={`flex-1 min-w-[60px] p-2 text-center cursor-pointer transition-all rounded-t-lg mx-0.5 ${
                    isFullySelected
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                    {weekday}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isFullySelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-zinc-100"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">{month}</div>
                </button>
              );
            })}
          </div>

          {/* Time slots grid */}
          <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="flex">
                {/* Time label */}
                <div className="w-20 shrink-0 px-2 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-zinc-700 flex items-center">
                  {formatTime(timeSlot.startMinute)}
                </div>
                {/* Slot cells */}
                {dates.map((dateKey, dateIndex) => {
                  const slot = slotsByDate[dateKey][timeIndex];
                  const isSelected = displaySelection.has(slot.id);
                  const voters = getVotersForSlot(slot.id);
                  const isHovered = hoveredSlot === slot.id;
                  const isLongPressed = longPressSlot === slot.id;
                  const showTooltip = (isHovered || isLongPressed) && voters.length > 0 && !isDragging;
                  const inRectangle = isSlotInRectangle(slot.id);
                  const hasCalendarConflict = conflictingSlotIds.includes(slot.id);
                  const slotCalendarEvents = calendarEventsForSlot.get(slot.id) || [];

                  // Determine border style for rectangle selection
                  let borderClasses = "border-r border-b border-gray-100 dark:border-zinc-800";
                  if (isDragging && rectangleBounds && inRectangle) {
                    const isTopEdge = timeIndex === rectangleBounds.minTime;
                    const isBottomEdge = timeIndex === rectangleBounds.maxTime;
                    const isLeftEdge = dateIndex === rectangleBounds.minDate;
                    const isRightEdge = dateIndex === rectangleBounds.maxDate;
                    
                    borderClasses = `
                      ${isTopEdge ? "border-t-2 border-t-blue-500 dark:border-t-blue-400" : "border-t border-t-transparent"}
                      ${isBottomEdge ? "border-b-2 border-b-blue-500 dark:border-b-blue-400" : "border-b border-b-gray-100 dark:border-b-zinc-800"}
                      ${isLeftEdge ? "border-l-2 border-l-blue-500 dark:border-l-blue-400" : "border-l border-l-transparent"}
                      ${isRightEdge ? "border-r-2 border-r-blue-500 dark:border-r-blue-400" : "border-r border-r-gray-100 dark:border-r-zinc-800"}
                    `;
                  }

                  // Determine background color based on vote mode
                  const getBackgroundClass = () => {
                    if (isSelected) {
                      // 選中的格子：綠色表示可以，紅色表示不行
                      return voteMode === "available"
                        ? "bg-emerald-500 dark:bg-emerald-600"
                        : "bg-rose-500 dark:bg-rose-600";
                    }
                    return "bg-white dark:bg-zinc-900";
                  };

                  return (
                    <div
                      key={slot.id}
                      data-slot-id={slot.id}
                      onMouseDown={(e) => handleMouseDown(slot.id, e)}
                      onMouseEnter={() => handleMouseEnter(slot.id)}
                      onTouchStart={(e) => handleTouchStart(slot.id, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`
                        flex-1 min-w-[60px] min-h-[44px] relative
                        cursor-pointer transition-colors duration-75
                        ${borderClasses}
                        ${getBackgroundClass()}
                        ${!isDragging && isHovered && !isSelected ? "bg-gray-50 dark:bg-zinc-800" : ""}
                        ${inRectangle ? "ring-inset ring-1 ring-blue-400/50" : ""}
                      `}
                    >
                      {/* Calendar events overlay */}
                      {showCalendarOnGrid && slotCalendarEvents.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {slotCalendarEvents.slice(0, 2).map((event, idx) => {
                            const isStart = isEventStartInSlot(slot.id, event);
                            const span = isStart ? getEventSpanFromSlot(slot.id, event) : 0;
                            
                            // Colors for different events
                            const colors = [
                              "bg-orange-400/80 dark:bg-orange-500/70",
                              "bg-purple-400/80 dark:bg-purple-500/70",
                            ];
                            
                            return (
                              <div
                                key={event.id}
                                className={`absolute left-0.5 right-0.5 ${colors[idx % colors.length]} ${
                                  isStart ? "rounded-t" : ""
                                } ${idx === 0 ? "top-0.5" : "top-5"}`}
                                style={{
                                  height: isStart && span > 1 
                                    ? `calc(${span * 100}% - 4px)` 
                                    : idx === 0 ? "calc(100% - 4px)" : "calc(50% - 2px)",
                                  zIndex: 10 + idx,
                                }}
                                title={`${event.summary}\n${formatEventTime(event)}`}
                              >
                                {isStart && (
                                  <div className="px-1 py-0.5 text-[9px] font-medium text-white truncate leading-tight">
                                    {event.summary}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {slotCalendarEvents.length > 2 && (
                            <div className="absolute bottom-0.5 right-0.5 text-[8px] bg-gray-800/70 text-white px-1 rounded">
                              +{slotCalendarEvents.length - 2}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vote count indicator */}
                      {voters.length > 0 && (
                        <div
                          className={`absolute bottom-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? voteMode === "available"
                                ? "bg-emerald-600 dark:bg-emerald-700 text-white"
                                : "bg-rose-600 dark:bg-rose-700 text-white"
                              : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                          }`}
                        >
                          {voters.length}
                        </div>
                      )}

                      {/* Tooltip showing voters */}
                      {showTooltip && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                          <div className="bg-gray-900 dark:bg-zinc-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                            <div className="font-medium mb-1 text-gray-300 dark:text-zinc-300">
                              {tJoined("votersForSlot")}
                            </div>
                            {voters.map((voter, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-emerald-400">✓</span>
                                {voter}
                              </div>
                            ))}
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-zinc-700" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 dark:text-zinc-400">
        {voteMode === "available" ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
              <span>{tJoined("legendAvailable")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
              <span>{tJoined("legendUnavailable")}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-500 dark:bg-rose-600" />
              <span>{tJoined("legendUnavailable")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
              <span>{tJoined("legendAvailable")}</span>
            </div>
          </>
        )}
        {/* Calendar event legend */}
        {showCalendarOnGrid && calendarEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400/80 dark:bg-orange-500/70" />
            <span>{tJoined("googleCalendar.legendCalendarEvent")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
