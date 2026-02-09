"use client";

import { VotingGridProps } from "./types";
import { useVotingGridController } from "./hooks";
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
  const { selection, pagination, matrix, calendar } = useVotingGridController({
    slots,
    votes,
    eventId,
    currentUserId,
    currentUserDisplayName,
  });

  const {
    voteMode,
    setVoteMode,
    selectedCount,
    clearSelection,
    selectAll,
    isDayFullySelected,
    selectEntireDay,
  } = selection;

  const { dates, paginatedDates, currentPage, datesPerPage, handlePageChange } =
    pagination;

  const {
    granularity,
    setGranularity,
    slotHeight,
    mergedTimeRows,
    slotMatrixRows,
    mergedRectBounds,
    isDragging,
    handleGridMouseUp,
    handleGridMouseLeave,
    handleMergedMouseDown,
    handleMergedMouseEnter,
    handleMergedTouchStart,
    handleMergedTouchMove,
    handleMergedTouchEnd,
    handleMergedClick,
  } = matrix;

  const {
    calendarStatus,
    calendarLoading,
    calendarEvents,
    conflictingSlotIds,
    loadingCalendar,
    showCalendarOnGrid,
    setShowCalendarOnGrid,
    connectCalendar,
    disconnectCalendar,
    markConflictsAsUnavailable,
  } = calendar;

  return (
    <div className="space-y-3 sm:space-y-4">
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

      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
        <VoteModeToggle voteMode={voteMode} onModeChange={setVoteMode} />
      </div>

      <SelectionInfoBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onSelectAll={selectAll}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-zinc-400">View</span>
        <GranularitySelector
          granularity={granularity}
          onChange={setGranularity}
        />
      </div>

      <DatePagination
        dates={dates}
        currentPage={currentPage}
        datesPerPage={datesPerPage}
        onPageChange={handlePageChange}
      />

      <div
        className="select-none transition-opacity duration-200 touch-pan-y"
        onMouseUp={handleGridMouseUp}
        onMouseLeave={handleGridMouseLeave}
      >
        <div className="relative">
          <DateHeader
            dates={paginatedDates}
            isDayFullySelected={isDayFullySelected}
            onSelectDay={selectEntireDay}
          />

          <div className="flex">
            <TimeColumn
              mergedTimeRows={mergedTimeRows}
              slotHeight={slotHeight}
            />

            <SlotMatrix
              rows={slotMatrixRows}
              voteMode={voteMode}
              isDragging={isDragging}
              mergedRectBounds={mergedRectBounds}
              slotHeight={slotHeight}
              showCalendarOnGrid={showCalendarOnGrid}
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

      <GridLegend
        voteMode={voteMode}
        showCalendarOnGrid={showCalendarOnGrid}
        calendarEvents={calendarEvents}
      />
    </div>
  );
}
