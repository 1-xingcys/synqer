"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  VotingGridProps,
  Vote,
  VoteMode,
  TimeGranularity,
  CalendarEvent,
} from "./types";
import {
  useVotingSelection,
  useCalendarIntegration,
  useTimeGranularity,
  useMergedRowDragSelection,
} from "./hooks";
import { groupVotesBySlot, formatTime } from "./utils";
import {
  VotingHeader,
  VoteModeToggle,
  SelectionInfoBar,
  GridLegend,
  DateHeader,
  TimeSlotCell,
  GoogleCalendarPanel,
  DatePagination,
  GranularitySelector,
} from "./ui";

export type { VotingGridProps, VoteMode };

// Hook to calculate dates per page and slot height based on screen width
function useResponsiveGrid() {
  const [datesPerPage, setDatesPerPage] = useState(7);
  const [slotHeight, setSlotHeight] = useState("2.75rem"); // Default to desktop

  useEffect(() => {
    const calculateValues = () => {
      const width = window.innerWidth;
      // sm breakpoint is 640px
      const isMobile = width < 640;

      // Dates per page
      let dates = 7;
      if (width < 400) dates = 5;
      else if (width < 640) dates = 5;
      else if (width < 768) dates = 6;
      else if (width < 1024) dates = 7;

      // Slot height: h-10 (2.5rem) on mobile, h-11 (2.75rem) on desktop
      const height = isMobile ? "2.5rem" : "2.75rem";

      setDatesPerPage(dates);
      setSlotHeight(height);
    };

    calculateValues();

    const handleResize = () => {
      calculateValues();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { datesPerPage, slotHeight };
}

export default function VotingGrid({
  slots,
  votes,
  onSave,
  initialSelectedIds = [],
  eventId,
}: VotingGridProps) {
  const t = useTranslations("event");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [granularity, setGranularity] = useState<TimeGranularity>(15);
  const gridRef = useRef<HTMLDivElement>(null);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  // Use voting selection hook (for utilities and base state)
  const {
    selectedSlots,
    voteMode,
    slotsByDate,
    dates,
    timeSlots,
    setSelectedSlots,
    setVoteMode,
    selectEntireDay,
    clearSelection,
    selectAll,
    isDayFullySelected,
    applyConflicts,
  } = useVotingSelection({ slots, initialSelectedIds });

  // Use time granularity hook
  const { mergedRows } = useTimeGranularity({
    timeSlots,
    granularity,
  });

  // Paginated dates (moved up because useMergedRowDragSelection needs it)
  const paginatedDates = useMemo(() => {
    const startIdx = currentPage * datesPerPage;
    return dates.slice(startIdx, startIdx + datesPerPage);
  }, [dates, currentPage, datesPerPage]);

  // Use merged row drag selection hook
  const {
    isDragging,
    hoveredCell,
    longPressCell,
    displaySelection,
    handleMouseDown: handleMergedMouseDown,
    handleMouseEnter: handleMergedMouseEnter,
    handleMouseUp: handleMergedMouseUp,
    handleTouchStart: handleMergedTouchStart,
    handleTouchMove: handleMergedTouchMove,
    handleTouchEnd: handleMergedTouchEnd,
    handleClick: handleMergedClick,
    setHoveredCell,
    isInDragRectangle,
    getRectangleBounds: getMergedRectangleBounds,
  } = useMergedRowDragSelection({
    selectedSlots,
    setSelectedSlots,
    mergedRows,
    slotsByDate,
    paginatedDates,
  });

  // Use calendar integration hook
  const {
    calendarStatus,
    calendarLoading,
    calendarEvents,
    conflictingSlotIds,
    loadingCalendar,
    showCalendarOnGrid,
    calendarEventsForSlot,
    setShowCalendarOnGrid,
    connectCalendar,
    disconnectCalendar,
  } = useCalendarIntegration({ eventId, slots, slotsByDate });

  // Reset page when datesPerPage changes
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(dates.length / datesPerPage) - 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [datesPerPage, dates.length, currentPage]);

  // Group votes by slot
  const votesBySlot = useMemo(() => groupVotesBySlot(votes), [votes]);

  // Get voters for a slot
  const getVotersForSlot = useCallback(
    (slotId: string): string[] => {
      return (votesBySlot[slotId] || []).map((v: Vote) => v.userDisplayName);
    },
    [votesBySlot],
  );

  // Get voters for merged row (all slots combined)
  const getVotersForMergedRow = useCallback(
    (slotIndices: number[], dateKey: string): string[] => {
      const allVoters = new Set<string>();
      slotIndices.forEach((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        if (slot) {
          const voters = getVotersForSlot(slot.id);
          voters.forEach((v) => allVoters.add(v));
        }
      });
      return Array.from(allVoters);
    },
    [slotsByDate, getVotersForSlot],
  );

  // Check if all slots in merged row are selected
  const isMergedRowSelected = useCallback(
    (slotIndices: number[], dateKey: string): boolean => {
      return slotIndices.every((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        return slot && displaySelection.has(slot.id);
      });
    },
    [slotsByDate, displaySelection],
  );

  // Check if any slot in merged row is selected (partial)
  const isMergedRowPartiallySelected = useCallback(
    (slotIndices: number[], dateKey: string): boolean => {
      const selectedCount = slotIndices.filter((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        return slot && displaySelection.has(slot.id);
      }).length;
      return selectedCount > 0 && selectedCount < slotIndices.length;
    },
    [slotsByDate, displaySelection],
  );

  // Get rectangle bounds for visual overlay
  const mergedRectBounds = getMergedRectangleBounds();

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedSlots), voteMode);
    } catch (error) {
      console.error("Save error:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  // Mark conflicts as unavailable
  const markConflictsAsUnavailable = useCallback(() => {
    applyConflicts(conflictingSlotIds);
  }, [applyConflicts, conflictingSlotIds]);

  // Handle page change with smooth transition
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Check if event starts in this merged row (for a specific date)
  const isEventStartInMergedRow = useCallback(
    (rowIndex: number, dateKey: string, event: CalendarEvent): boolean => {
      const row = mergedRows[rowIndex];
      if (!row) return false;

      // Check if any slot in this merged row contains the event
      const hasEventInRow = row.slotIndices.some((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        if (!slot) return false;
        const eventsInSlot = calendarEventsForSlot.get(slot.id) || [];
        return eventsInSlot.some((e) => e.id === event.id);
      });

      if (!hasEventInRow) return false;

      // Check if any previous merged row also contains this event
      for (let i = 0; i < rowIndex; i++) {
        const prevRow = mergedRows[i];
        const prevHasEvent = prevRow.slotIndices.some((idx) => {
          const slot = slotsByDate[dateKey]?.[idx];
          if (!slot) return false;
          const eventsInSlot = calendarEventsForSlot.get(slot.id) || [];
          return eventsInSlot.some((e) => e.id === event.id);
        });
        if (prevHasEvent) return false; // Event started in an earlier row
      }

      return true;
    },
    [mergedRows, slotsByDate, calendarEventsForSlot],
  );

  // Get how many merged rows an event spans from a given row index
  const getEventSpanInMergedRows = useCallback(
    (rowIndex: number, dateKey: string, event: CalendarEvent): number => {
      let span = 0;
      for (let i = rowIndex; i < mergedRows.length; i++) {
        const row = mergedRows[i];
        const hasEventInRow = row.slotIndices.some((idx) => {
          const slot = slotsByDate[dateKey]?.[idx];
          if (!slot) return false;
          const eventsInSlot = calendarEventsForSlot.get(slot.id) || [];
          return eventsInSlot.some((e) => e.id === event.id);
        });
        if (hasEventInRow) {
          span++;
        } else {
          break;
        }
      }
      return span;
    },
    [mergedRows, slotsByDate, calendarEventsForSlot],
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Google Calendar Integration */}
      <GoogleCalendarPanel
        eventId={eventId}
        calendarStatus={calendarStatus}
        calendarLoading={calendarLoading}
        conflictingSlotIds={conflictingSlotIds}
        loadingCalendar={loadingCalendar}
        showCalendarOnGrid={showCalendarOnGrid}
        setShowCalendarOnGrid={setShowCalendarOnGrid}
        connectCalendar={connectCalendar}
        disconnectCalendar={disconnectCalendar}
        markConflictsAsUnavailable={markConflictsAsUnavailable}
      />

      {/* Top Bar: Mode Toggle + Save */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
        {/* Vote Mode Toggle */}
        <VoteModeToggle voteMode={voteMode} onModeChange={setVoteMode} />

        {/* Save Button */}
        <VotingHeader saving={saving} onSave={() => void handleSave()} />
      </div>

      {/* Selection info bar */}
      <SelectionInfoBar
        selectedCount={displaySelection.size}
        onClear={clearSelection}
        onSelectAll={selectAll}
      />

      {/* Granularity Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-zinc-400">View</span>
        <GranularitySelector
          granularity={granularity}
          onChange={setGranularity}
        />
      </div>

      {/* Date Pagination */}
      <DatePagination
        dates={dates}
        currentPage={currentPage}
        datesPerPage={datesPerPage}
        onPageChange={handlePageChange}
      />

      {/* Grid */}
      <div
        ref={gridRef}
        className="select-none transition-opacity duration-200 touch-none"
        onMouseUp={handleMergedMouseUp}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className="relative">
          {/* Date headers */}
          <DateHeader
            dates={paginatedDates}
            isDayFullySelected={isDayFullySelected}
            onSelectDay={selectEntireDay}
          />

          {/* Time slots grid with time points at boundaries */}
          <div className="flex">
            {/* Time column - shows time points at boundaries */}
            <div className="w-9 sm:w-14 shrink-0 relative border-r border-gray-200 dark:border-zinc-700 rounded-l-lg">
              {mergedRows.map((row, rowIndex) => (
                <div key={rowIndex} className="h-10 sm:h-11 relative">
                  {/* Time label at top boundary */}
                  <span className="absolute -top-2 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                    {formatTime(row.startMinute)}
                  </span>
                </div>
              ))}
              {/* Last time label */}
              {mergedRows.length > 0 && (
                <span className="absolute bottom-0.5 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                  {formatTime(mergedRows[mergedRows.length - 1].endMinute)}
                </span>
              )}
            </div>

            {/* Slots grid - CSS variable for slot height used by calendar event overlay */}
            <div
              className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
              style={{ "--slot-height": slotHeight } as React.CSSProperties}
            >
              {mergedRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {/* Merged slot cells */}
                  {paginatedDates.map((dateKey, dateIndex) => {
                    // Get all slot IDs for this merged row
                    const slotIds = row.slotIndices
                      .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
                      .filter(Boolean);

                    // Use first slot for basic props
                    const firstSlotIdx = row.slotIndices[0];
                    const firstSlot = slotsByDate[dateKey]?.[firstSlotIdx];

                    if (!firstSlot) return null;

                    const isSelected = isMergedRowSelected(
                      row.slotIndices,
                      dateKey,
                    );
                    const isPartiallySelected = isMergedRowPartiallySelected(
                      row.slotIndices,
                      dateKey,
                    );
                    const voters = getVotersForMergedRow(
                      row.slotIndices,
                      dateKey,
                    );
                    const isHovered =
                      hoveredCell?.rowIndex === rowIndex &&
                      hoveredCell?.dateIndex === dateIndex;
                    const isLongPressed =
                      longPressCell?.rowIndex === rowIndex &&
                      longPressCell?.dateIndex === dateIndex;

                    // Check if this merged cell is in the drag rectangle
                    const inRectangle = isInDragRectangle(rowIndex, dateIndex);

                    // Get calendar events for all slots in this merged row
                    const mergedCalendarEvents = row.slotIndices.flatMap(
                      (idx) => {
                        const slot = slotsByDate[dateKey]?.[idx];
                        return slot
                          ? calendarEventsForSlot.get(slot.id) || []
                          : [];
                      },
                    );
                    // Deduplicate events by id
                    const uniqueCalendarEvents = mergedCalendarEvents.filter(
                      (event, index, self) =>
                        self.findIndex((e) => e.id === event.id) === index,
                    );

                    return (
                      <TimeSlotCell
                        key={`${dateKey}-${rowIndex}`}
                        slot={firstSlot}
                        rowIndex={rowIndex}
                        dateIndex={dateIndex}
                        isSelected={isSelected}
                        isPartiallySelected={isPartiallySelected}
                        isHovered={isHovered}
                        isLongPressed={isLongPressed}
                        isDragging={isDragging}
                        inRectangle={inRectangle}
                        mergedRectBounds={mergedRectBounds}
                        voteMode={voteMode}
                        voters={voters}
                        slotCalendarEvents={uniqueCalendarEvents}
                        showCalendarOnGrid={showCalendarOnGrid}
                        isEventStartInMergedRow={(event) =>
                          isEventStartInMergedRow(rowIndex, dateKey, event)
                        }
                        getEventSpanInMergedRows={(event) =>
                          getEventSpanInMergedRows(rowIndex, dateKey, event)
                        }
                        mergedSlotIds={slotIds}
                        onMouseDown={(e) =>
                          handleMergedMouseDown(rowIndex, dateIndex, e)
                        }
                        onMouseEnter={() =>
                          handleMergedMouseEnter(rowIndex, dateIndex)
                        }
                        onTouchStart={(e) =>
                          handleMergedTouchStart(rowIndex, dateIndex, e)
                        }
                        onTouchMove={handleMergedTouchMove}
                        onTouchEnd={handleMergedTouchEnd}
                        onClick={() => handleMergedClick(rowIndex, dateIndex)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <GridLegend
        voteMode={voteMode}
        showCalendarOnGrid={showCalendarOnGrid}
        calendarEvents={calendarEvents}
      />
    </div>
  );
}
