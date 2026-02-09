"use client";

import { useTranslations } from "next-intl";
import { VotingGridProps } from "./types";
import { useVotingGridController } from "./hooks";
import {
  VoteModeToggle,
  GridLegend,
  DateHeader,
  TimeColumn,
  SlotMatrix,
  GoogleCalendarPanel,
  DatePagination,
  GranularitySelector,
  MobileGridToolsMenu,
} from "./ui";

export type { VotingGridProps };

export default function VotingGrid({
  slots,
  votes,
  eventId,
  currentUserId,
  currentUserDisplayName,
}: VotingGridProps) {
  const tJoined = useTranslations("joined");
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

      <div className="hidden sm:flex w-full items-center justify-between gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40">
        <div className="flex items-center gap-3">
          <VoteModeToggle voteMode={voteMode} onModeChange={setVoteMode} />
          <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {tJoined("mobileTools.view")}
            </span>
            <GranularitySelector
              granularity={granularity}
              onChange={setGranularity}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
          >
            {tJoined("selectAll")}
          </button>
          <button
            onClick={clearSelection}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
          >
            {tJoined("clearSelection")}
          </button>
        </div>
      </div>

      <div className="sm:hidden flex items-center">
        <div className="w-9 shrink-0 flex justify-center">
          <MobileGridToolsMenu
            voteMode={voteMode}
            onModeChange={setVoteMode}
            granularity={granularity}
            onGranularityChange={setGranularity}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
          />
        </div>
        <div className="flex-1 min-w-0">
          <DatePagination
            dates={dates}
            currentPage={currentPage}
            datesPerPage={datesPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <div className="hidden sm:block">
        <DatePagination
          dates={dates}
          currentPage={currentPage}
          datesPerPage={datesPerPage}
          onPageChange={handlePageChange}
        />
      </div>

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
