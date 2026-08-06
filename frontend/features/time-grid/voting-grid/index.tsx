"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { VotingGridProps } from "../types";
import { useVotingGridController } from "./hooks/useVotingGridController";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";
import { Z_INDEX } from "@/lib/zIndex";
import { DateHeader, TimeColumn, DatePagination } from "../ui";
import { GridLegend } from "./GridLegend";
import { SlotMatrix } from "./SlotMatrix";
import { GoogleCalendarPanel } from "./GoogleCalendarPanel";
import { GridToolsMenu } from "./GridToolsMenu";
import { VoteCommitBar } from "./VoteCommitBar";

export default function VotingGrid({
  slots,
  votes,
  stagedVote,
  currentUserHasVoted,
  eventId,
  currentUserId,
  eventTitle,
  timeZone,
  capabilities,
  defaultGranularity,
  defaultVoteMode,
  shareVoteToChat,
}: VotingGridProps) {
  const tJoined = useTranslations("joined");
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isStickyActive, setIsStickyActive] = useState(false);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const { selection, pagination, matrix, calendar } = useVotingGridController({
    slots,
    votes,
    stagedVote,
    currentUserHasVoted,
    eventId,
    currentUserId,
    eventTitle,
    timeZone,
    capabilities,
    defaultGranularity,
    defaultVoteMode,
    shareVoteToChat,
  });

  const {
    voteMode,
    setVoteMode,
    clearSelection,
    selectAll,
    hasStagedVoteDraft,
    commitStagedVotes,
    isCommitting,
    commitFeedback,
    isDayFullySelected,
    selectEntireDay,
  } = selection;

  const {
    columns,
    paginatedDates,
    currentPage,
    datesPerPage,
    handlePageChange,
  } = pagination;

  const {
    granularity,
    setGranularity,
    slotHeight,
    mergedTimeRows,
    slotMatrixRows,
    isDragging,
    handleGridMouseUp,
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
    isCalendarSupported,
    connectCalendar,
    disconnectCalendar,
    markConflictsAsUnavailable,
  } = calendar;
  const firstTimeLabel =
    mergedTimeRows.length > 0
      ? formatMinutesToTime(mergedTimeRows[0].startMinute)
      : undefined;

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

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const active =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setIsStickyActive(active);
      },
      { threshold: [0, 1] },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      setIsStickyActive(false);
    };
  }, []);

  return (
    <div
      className={`relative ${Z_INDEX.GRID_BASE} bg-white dark:bg-zinc-900 shadow rounded-lg overflow-visible border border-gray-200 dark:border-zinc-800 px-2 pb-2 sm:px-6 sm:pb-6`}
    >
      <div>
        <div ref={stickySentinelRef} className="h-px" aria-hidden />

        <div
          className={`sticky top-0 ${Z_INDEX.GRID_BASE} bg-white dark:bg-zinc-900 backdrop-blur supports-[backdrop-filter]:bg-white/100 dark:supports-[backdrop-filter]:bg-zinc-900/100 space-y-2 sm:space-y-4`}
        >
          <VoteCommitBar
            hasStagedVoteDraft={hasStagedVoteDraft}
            hasCommittedVote={currentUserHasVoted}
            isCommitting={isCommitting}
            commitFeedback={commitFeedback}
            onCommit={commitStagedVotes}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DatePagination
                columns={columns}
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
              showCalendarTools={isCalendarSupported}
              calendarStatus={calendarStatus}
              onOpenCalendarPanel={() => setIsCalendarModalOpen(true)}
              onDisconnectCalendar={disconnectCalendar}
            />
          </div>

          <DateHeader
            columns={columns.filter((column) =>
              paginatedDates.includes(column.key),
            )}
            isDayFullySelected={isDayFullySelected}
            onSelectDay={selectEntireDay}
            firstTimeLabel={firstTimeLabel}
            isStickyActive={isStickyActive}
          />
        </div>

        <div
          className="select-none transition-opacity duration-200 touch-pan-y"
          onMouseUp={handleGridMouseUp}
        >
          <div className="relative">
            <div className="flex">
              <TimeColumn
                mergedTimeRows={mergedTimeRows}
                slotHeight={slotHeight}
                showFirstBoundaryLabel={false}
              />

              <SlotMatrix
                rows={slotMatrixRows}
                voteMode={voteMode}
                isDragging={isDragging}
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

        <div className="mt-2 sm:mt-4">
          <GridLegend
            voteMode={voteMode}
            hasStagedVoteDraft={hasStagedVoteDraft}
            showCalendarOnGrid={showCalendarOnGrid}
            calendarEvents={calendarEvents}
          />
        </div>
      </div>

      {isCalendarSupported && isCalendarModalOpen && (
        <>
          <div
            className={`fixed inset-0 ${Z_INDEX.MODAL_BACKDROP} bg-black/55 backdrop-blur-sm animate-in fade-in duration-200`}
            onClick={() => setIsCalendarModalOpen(false)}
          />
          <div
            className={`fixed inset-0 ${Z_INDEX.MODAL_CONTENT} p-3 sm:p-6 flex items-end sm:items-center justify-center pointer-events-none`}
          >
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
