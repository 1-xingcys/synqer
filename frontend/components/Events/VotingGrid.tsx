"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

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

interface VotingGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  onSave: (selectedSlotIds: string[]) => Promise<void>;
  initialSelectedIds?: string[];
  currentUserId?: string;
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
}: VotingGridProps) {
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [saving, setSaving] = useState(false);
  const [hasSubmittedVote, setHasSubmittedVote] = useState(initialSelectedIds.length > 0);
  
  // Rectangle selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<GridPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<GridPosition | null>(null);
  const [baseSelection, setBaseSelection] = useState<Set<string>>(new Set(initialSelectedIds));
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [longPressSlot, setLongPressSlot] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedSlots));
      setHasSubmittedVote(true);
    } catch (error) {
      console.error("Save error:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
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
            {t("selectAvailableSlots")}
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

      {/* Instructions */}
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        {tJoined("dragToSelect")}
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
                        ${
                          isSelected
                            ? "bg-emerald-500 dark:bg-emerald-600"
                            : "bg-white dark:bg-zinc-900"
                        }
                        ${!isDragging && isHovered && !isSelected ? "bg-gray-50 dark:bg-zinc-800" : ""}
                        ${inRectangle ? "ring-inset ring-1 ring-blue-400/50" : ""}
                      `}
                    >
                      {/* Vote count indicator */}
                      {voters.length > 0 && (
                        <div
                          className={`absolute bottom-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-emerald-600 dark:bg-emerald-700 text-white"
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
      <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
          <span>{t("available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700" />
          <span>{t("unavailable")}</span>
        </div>
      </div>
    </div>
  );
}
