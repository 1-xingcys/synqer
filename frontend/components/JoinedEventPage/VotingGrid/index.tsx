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
  const gridRef = useRef<HTMLDivElement>(null);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

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
    handleClick,
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
        className="select-none transition-opacity duration-200 touch-none"
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

          {/* Time slots grid with time points at boundaries */}
          <div className="flex">
            {/* Time column - shows time points at boundaries */}
            <div className="w-9 sm:w-14 shrink-0 relative border-r border-gray-200 dark:border-zinc-700 rounded-l-lg">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div
                  key={timeIndex}
                  className="h-10 sm:h-11 relative"
                >
                  {/* Time label at top boundary */}
                  <span className="absolute -top-2 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                    {formatTime(timeSlot.startMinute)}
                  </span>
                </div>
              ))}
              {/* Last time label at bottom */}
              {timeSlots.length > 0 && (
                <span className="absolute bottom-0.5 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                  {formatTime(timeSlots[timeSlots.length - 1].endMinute)}
                </span>
              )}
            </div>

            {/* Slots grid - CSS variable for slot height used by calendar event overlay */}
            <div 
              className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
              style={{ "--slot-height": slotHeight } as React.CSSProperties}
            >
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeIndex} className="flex">
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
                        onClick={handleClick}
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
