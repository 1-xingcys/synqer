"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { VotingGridProps } from "./types";
import { useVotingGridController } from "./hooks";
import {
  GridLegend,
  DateHeader,
  TimeColumn,
  SlotMatrix,
  GoogleCalendarPanel,
  DatePagination,
  GridToolsMenu,
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
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
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

  useEffect(() => {
    if (!isCalendarModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCalendarModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCalendarModalOpen]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <DatePagination
            dates={dates}
            currentPage={currentPage}
            datesPerPage={datesPerPage}
            onPageChange={handlePageChange}
          />
        </div>
        <GridToolsMenu
          voteMode={voteMode}
          onModeChange={setVoteMode}
          granularity={granularity}
          onGranularityChange={setGranularity}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          calendarStatus={calendarStatus}
          onOpenCalendarPanel={() => setIsCalendarModalOpen(true)}
          onDisconnectCalendar={disconnectCalendar}
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

      {isCalendarModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsCalendarModalOpen(false)}
          />
          <div className="fixed inset-0 z-[100] p-3 sm:p-6 flex items-end sm:items-center justify-center pointer-events-none">
            <div className="w-full max-w-2xl pointer-events-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/60">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {tJoined("googleCalendar.settings")}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCalendarModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Close calendar panel"
                  >
                    ×
                  </button>
                </div>
                <div className="p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
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
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
