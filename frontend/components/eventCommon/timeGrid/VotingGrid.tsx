"use client";

import { useMemo, useCallback, useState } from "react";
import { VotingGridProps, Vote, CalendarEvent, TimeGranularity } from "./types";
import {
  useVotingSelection,
  useCalendarIntegration,
  useMergedRowDragSelection,
  useMergedRows,
  useResponsiveGrid,
  usePaginatedDates,
  useOptimisticVoting,
} from "./hooks";
import { groupVotesBySlot } from "./utils";
import {
  VoteModeToggle,
  SelectionInfoBar,
  GridLegend,
  DateHeader,
  TimeColumn,
  SlotMatrix,
  GoogleCalendarPanel,
  DatePagination,
  GranularitySelector,
} from "./ui";

export type { VotingGridProps };

export default function VotingGrid({
  slots,
  votes,
  eventId,
  currentUserId,
  currentUserDisplayName,
}: VotingGridProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>(15);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  // Optimistic voting hook — 從 cache 派生 selectedSlots + 提供 mutation
  const { selectedSlots, toggleSlots, replaceAllSlots } = useOptimisticVoting({
    eventId,
    currentUserId,
    currentUserDisplayName,
    votes,
  });

  // Use voting selection hook (grid data + voteMode + actions)
  const {
    voteMode,
    slotsByDate,
    dates,
    timeSlots,
    displaySelection: modeDisplaySelection,
    setVoteMode,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    isDayFullySelected,
    applyConflicts,
  } = useVotingSelection({
    slots,
    selectedSlots,
    onSelectionCommit: toggleSlots,
    onReplaceAll: replaceAllSlots,
  });

  // Use time granularity hook
  const { mergedRows } = useMergedRows({
    timeSlots,
    granularity,
  });

  // Use paginated dates hook
  const { paginatedDates, currentPage, setCurrentPage } = usePaginatedDates({
    dates,
    datesPerPage,
  });

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
    selectedSlots: modeDisplaySelection,
    mergedRows,
    slotsByDate,
    paginatedDates,
    onSelectionCommit: commitDisplaySelectionChange,
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

  // Get rectangle bounds for visual overlay
  const mergedRectBounds = getMergedRectangleBounds();

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

      {/* Top Bar: Mode Toggle */}
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
        {/* Vote Mode Toggle */}
        <VoteModeToggle voteMode={voteMode} onModeChange={setVoteMode} />
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
            {/* Time column */}
            <TimeColumn mergedRows={mergedRows} slotHeight={slotHeight} />

            {/* Slots grid */}
            <SlotMatrix
              mergedRows={mergedRows}
              paginatedDates={paginatedDates}
              slotsByDate={slotsByDate}
              displaySelection={displaySelection}
              voteMode={voteMode}
              isDragging={isDragging}
              hoveredCell={hoveredCell}
              longPressCell={longPressCell}
              mergedRectBounds={mergedRectBounds}
              slotHeight={slotHeight}
              showCalendarOnGrid={showCalendarOnGrid}
              calendarEventsForSlot={calendarEventsForSlot}
              isInDragRectangle={isInDragRectangle}
              getVotersForMergedRow={getVotersForMergedRow}
              isEventStartInMergedRow={isEventStartInMergedRow}
              getEventSpanInMergedRows={getEventSpanInMergedRows}
              onMouseDown={handleMergedMouseDown}
              onMouseEnter={handleMergedMouseEnter}
              onTouchStart={handleMergedTouchStart}
              onTouchMove={handleMergedTouchMove}
              onTouchEnd={handleMergedTouchEnd}
              onClick={handleMergedClick}
            />
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
