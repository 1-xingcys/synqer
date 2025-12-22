"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { VotingGridProps, Vote, VoteMode } from "./types";
import { useVotingSelection, useCalendarIntegration } from "./hooks";
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
} from "./ui";

export type { VotingGridProps, VoteMode };

// Hook to calculate dates per page based on screen width
function useDatesPerPage() {
  const [datesPerPage, setDatesPerPage] = useState(7);

  useEffect(() => {
    const calculateDatesPerPage = () => {
      const width = window.innerWidth;
      if (width < 480) return 3;
      if (width < 640) return 4;
      if (width < 768) return 5;
      if (width < 1024) return 7;
      return 7;
    };

    setDatesPerPage(calculateDatesPerPage());

    const handleResize = () => {
      setDatesPerPage(calculateDatesPerPage());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return datesPerPage;
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
  const gridRef = useRef<HTMLDivElement>(null);
  const datesPerPage = useDatesPerPage();

  // Use voting selection hook
  const {
    selectedSlots,
    isDragging,
    hoveredSlot,
    longPressSlot,
    voteMode,
    displaySelection,
    slotsByDate,
    dates,
    timeSlots,
    setHoveredSlot,
    setVoteMode,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    selectEntireDay,
    clearSelection,
    selectAll,
    isSlotInRectangle,
    getRectangleBounds,
    isDayFullySelected,
    applyConflicts,
  } = useVotingSelection({ slots, initialSelectedIds });

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
    isEventStartInSlot,
    getEventSpanFromSlot,
  } = useCalendarIntegration({ eventId, slots, slotsByDate });

  // Paginated dates
  const paginatedDates = useMemo(() => {
    const startIdx = currentPage * datesPerPage;
    return dates.slice(startIdx, startIdx + datesPerPage);
  }, [dates, currentPage, datesPerPage]);

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

  // Get rectangle bounds
  const rectangleBounds = getRectangleBounds();

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

  return (
    <div className="space-y-4">
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
      <div className="flex items-start sm:items-center justify-between gap-3">
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
        className="select-none transition-opacity duration-200"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <div className="relative">
          {/* Date headers */}
          <DateHeader
            dates={paginatedDates}
            isDayFullySelected={isDayFullySelected}
            onSelectDay={selectEntireDay}
          />

          {/* Time slots grid */}
          <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="flex">
                {/* Time label */}
                <div className="w-16 sm:w-20 shrink-0 px-1 sm:px-2 py-2 sm:py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-zinc-700 flex items-center">
                  {formatTime(timeSlot.startMinute)}
                </div>
                {/* Slot cells */}
                {paginatedDates.map((dateKey, dateIndex) => {
                  const slot = slotsByDate[dateKey][timeIndex];
                  const isSelected = displaySelection.has(slot.id);
                  const voters = getVotersForSlot(slot.id);
                  const isHovered = hoveredSlot === slot.id;
                  const isLongPressed = longPressSlot === slot.id;
                  const inRectangle = isSlotInRectangle(slot.id);
                  const slotCalendarEvents =
                    calendarEventsForSlot.get(slot.id) || [];

                  return (
                    <TimeSlotCell
                      key={slot.id}
                      slot={slot}
                      dateIndex={dateIndex}
                      timeIndex={timeIndex}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      isLongPressed={isLongPressed}
                      isDragging={isDragging}
                      inRectangle={inRectangle}
                      rectangleBounds={rectangleBounds}
                      voteMode={voteMode}
                      voters={voters}
                      slotCalendarEvents={slotCalendarEvents}
                      showCalendarOnGrid={showCalendarOnGrid}
                      isEventStartInSlot={isEventStartInSlot}
                      getEventSpanFromSlot={getEventSpanFromSlot}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                  );
                })}
              </div>
            ))}
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
