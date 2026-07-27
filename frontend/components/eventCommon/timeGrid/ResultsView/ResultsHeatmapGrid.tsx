"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocale } from "next-intl";
import { ResultsAvailabilityMode, SlotRangeInfo } from "./types";
import { getHeatmapClasses } from "./HeatMapLegend";
import { SlotDetailModal } from "./SlotDetailModal";
import { ResultsGridToolsMenu } from "./ResultsGridToolsMenu";
import { useResultsAvailabilityMetrics } from "./hooks/useResultsAvailabilityMetrics";
import {
  DateHeader,
  DatePagination,
  TimeColumn,
} from "@/components/eventCommon/timeGrid/ui";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";
import { Z_INDEX } from "@/lib/zIndex";
import { formatAxisKeyLabel } from "@/lib/event-presentation";
import type { AxisSpan } from "@/lib/axisSpan";
import type { CalendarDay } from "@/lib/time";
import {
  useResponsiveGrid,
  usePaginatedDates,
  useMergedTimeRowsModel,
  useSlotGridModel,
} from "../hooks";
import { TimeGranularity, TimeSlot, Vote, Participant } from "../types";
import {
  SelectionRange,
  useResultsRangeSelection,
} from "./hooks/useResultsRangeSelection";

interface ResultsHeatmapGridProps {
  slots: TimeSlot[];
  /** 根據 slotId 分組的投票（從 ResultsView 傳入） */
  votesBySlot: Record<string, Vote[]>;
  participants: Participant[];
  selectedParticipants: Set<string>;
  maxVotes: number;
  mode: ResultsAvailabilityMode;
  onModeChange: (mode: ResultsAvailabilityMode) => void;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
  // Host-only props for adding time ranges to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo) => Promise<boolean>;
  // Committed slot IDs to display with persistent highlight
  committedSlotIds?: Set<string>;
  // Staged slot IDs to display with draft highlight
  stagedSlotIds?: Set<string> | null;
  // Baseline slot IDs used to tell whether staged slots are newly added
  stagedBaselineSlotIds?: Set<string> | null;
  getShareableLink: () => string;
  onCopyShareLink: () => void;
  linkCopied: boolean;
}

export function ResultsHeatmapGrid({
  slots,
  votesBySlot,
  participants,
  selectedParticipants,
  maxVotes,
  mode,
  onModeChange,
  granularity,
  onGranularityChange,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  committedSlotIds,
  stagedSlotIds,
  stagedBaselineSlotIds,
  getShareableLink,
  onCopyShareLink,
  linkCopied,
}: ResultsHeatmapGridProps) {
  const locale = useLocale();
  const gridRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const [isStickyActive, setIsStickyActive] = useState(false);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  // Modal state
  const [modalData, setModalData] = useState<{
    dateLabel: string;
    timeLabel: string;
    voters: Vote[];
    nonVoters: Participant[];
    rangeInfo: SlotRangeInfo;
  } | null>(null);

  const { slotsByDate, dates, columns, timeSlots } = useSlotGridModel({
    slots,
  });
  // Merged rows for granularity (using shared hook)
  const { mergedTimeRows } = useMergedTimeRowsModel({ timeSlots, granularity });

  // Use paginated dates hook (handles page clamping automatically)
  const { paginatedDates, currentPage, setCurrentPage } = usePaginatedDates({
    dates,
    datesPerPage,
  });

  // buildAxisColumns maps over `dates`, so the two stay 1:1 and index-aligned.
  const paginatedColumns = useMemo(() => {
    const byKey = new Map(columns.map((column) => [column.key, column]));
    return paginatedDates.flatMap((dateKey) => {
      const column = byKey.get(dateKey);
      return column ? [column] : [];
    });
  }, [columns, paginatedDates]);

  const {
    getCellCount,
    getAvailableVotesForRange,
    getUnavailableParticipantsForRange,
    getSlotIdsFromRange,
  } = useResultsAvailabilityMetrics({
    slotsByDate,
    dates,
    mergedTimeRows,
    votesBySlot,
    participants,
    selectedParticipants,
  });

  const getCellSelectionState = useCallback(
    (slotIndices: number[], dateKey: string) => {
      const slotIds = slotIndices
        .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
        .filter((slotId): slotId is string => Boolean(slotId));

      const hasCommitted = Boolean(
        committedSlotIds &&
          slotIds.some((slotId) => committedSlotIds.has(slotId)),
      );
      const hasStaged = Boolean(
        stagedSlotIds && slotIds.some((slotId) => stagedSlotIds.has(slotId)),
      );
      const hasStagedBaseline = Boolean(
        stagedBaselineSlotIds &&
          slotIds.some((slotId) => stagedBaselineSlotIds.has(slotId)),
      );
      const hasStagedRemoved = Boolean(
        stagedBaselineSlotIds &&
          stagedSlotIds &&
          slotIds.some(
            (slotId) =>
              stagedBaselineSlotIds.has(slotId) && !stagedSlotIds.has(slotId),
          ),
      );

      if (stagedSlotIds) {
        if (hasStaged && !hasStagedBaseline) return "staged-add";
        if (hasStagedRemoved) return "staged-remove";
        if (hasCommitted || hasStagedBaseline) return "committed";
        return "none";
      }

      return hasCommitted ? "committed" : "none";
    },
    [committedSlotIds, stagedBaselineSlotIds, stagedSlotIds, slotsByDate],
  );

  // Get selected cell boundaries for border rendering
  const getSelectedCellBoundaries = useCallback(
    (
      rowIndex: number,
      dateIndex: number,
      slotIndices: number[],
      dateKey: string,
      targetState: "none" | "committed" | "staged-add" | "staged-remove",
    ): {
      isTop: boolean;
      isBottom: boolean;
      isLeft: boolean;
      isRight: boolean;
    } => {
      if (targetState === "none") {
        return { isTop: false, isBottom: false, isLeft: false, isRight: false };
      }

      if (getCellSelectionState(slotIndices, dateKey) !== targetState) {
        return { isTop: false, isBottom: false, isLeft: false, isRight: false };
      }

      // Check adjacent cells
      const checkAdjacentSelected = (rIdx: number, dIdx: number): boolean => {
        const adjDateKey = paginatedDates[dIdx];
        const adjRow = mergedTimeRows[rIdx];
        if (!adjDateKey || !adjRow) return false;
        return (
          getCellSelectionState(adjRow.slotIndices, adjDateKey) === targetState
        );
      };

      const isTop =
        rowIndex === 0 || !checkAdjacentSelected(rowIndex - 1, dateIndex);
      const isBottom =
        rowIndex === mergedTimeRows.length - 1 ||
        !checkAdjacentSelected(rowIndex + 1, dateIndex);
      const isLeft =
        dateIndex === 0 || !checkAdjacentSelected(rowIndex, dateIndex - 1);
      const isRight =
        dateIndex === paginatedDates.length - 1 ||
        !checkAdjacentSelected(rowIndex, dateIndex + 1);

      return { isTop, isBottom, isLeft, isRight };
    },
    [getCellSelectionState, paginatedDates, mergedTimeRows],
  );

  // Label a span's ends. The range carries its own axis, so the kind no longer
  // has to be recovered by looking the start key up in the column map.
  const formatSpanForModal = useCallback(
    (axis: AxisSpan) => {
      if (axis.axisType === "WEEKDAY") {
        return formatAxisKeyLabel(axis, locale);
      }

      const label = (day: CalendarDay) =>
        formatAxisKeyLabel(
          { axisType: "DATE", startDay: day, endDay: day },
          locale,
        );

      return axis.startDay === axis.endDay
        ? label(axis.startDay)
        : `${label(axis.startDay)} ~ ${label(axis.endDay)}`;
    },
    [locale],
  );

  // Show modal with selection data
  const showModalForSelection = useCallback(
    (range: SelectionRange) => {
      const voters = getAvailableVotesForRange(range.cells);
      const nonVoters = getUnavailableParticipantsForRange(range.cells);
      const slotIds = getSlotIdsFromRange(range.cells);

      // Format time label
      const timeLabel = `${formatMinutesToTime(range.startTime)} - ${formatMinutesToTime(range.endTime)}`;

      setModalData({
        dateLabel: formatSpanForModal(range.axis),
        timeLabel,
        voters,
        nonVoters,
        rangeInfo: {
          axis: range.axis,
          startTime: range.startTime,
          endTime: range.endTime,
          slotIds,
        },
      });
    },
    [
      getAvailableVotesForRange,
      getUnavailableParticipantsForRange,
      getSlotIdsFromRange,
      formatSpanForModal,
    ],
  );

  const {
    isDragging,
    rectBounds,
    isInDragRectangle,
    handleCellClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useResultsRangeSelection({
    gridRef,
    mergedTimeRows,
    paginatedColumns,
    onRangeSelect: showModalForSelection,
  });
  const maxHeatmapCount =
    mode === "available" ? maxVotes : selectedParticipants.size;
  const firstTimeLabel =
    mergedTimeRows.length > 0
      ? formatMinutesToTime(mergedTimeRows[0].startMinute)
      : undefined;

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
    <div className="space-y-0">
      <div ref={stickySentinelRef} className="h-px" aria-hidden />

      <div
        className={`sticky top-0 ${Z_INDEX.GRID_BASE} bg-white/100 dark:bg-zinc-900/100 backdrop-blur supports-[backdrop-filter]:bg-white/100 dark:supports-[backdrop-filter]:bg-zinc-900/100 space-y-2 sm:space-y-3`}
      >
        <div className="h-3" />
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <DatePagination
              columns={columns}
              currentPage={currentPage}
              datesPerPage={datesPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
          <ResultsGridToolsMenu
            mode={mode}
            onModeChange={onModeChange}
            granularity={granularity}
            onGranularityChange={onGranularityChange}
            getShareableLink={getShareableLink}
            onCopyShareLink={onCopyShareLink}
            linkCopied={linkCopied}
          />
        </div>

        <DateHeader
          columns={paginatedColumns}
          selectable={false}
          firstTimeLabel={firstTimeLabel}
          isStickyActive={isStickyActive}
        />
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="select-none touch-pan-y"
        style={{ "--slot-height": slotHeight } as React.CSSProperties}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative">
          {/* Time slots grid */}
          <div className="flex touch-pan-y">
            <TimeColumn
              mergedTimeRows={mergedTimeRows}
              slotHeight={slotHeight}
              showFirstBoundaryLabel={false}
            />

            {/* Slots grid */}
            <div
              data-grid="slots"
              className="flex-1 touch-none border border-gray-200 dark:border-zinc-700 overflow-hidden"
            >
              {mergedTimeRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {paginatedColumns.map((column, dateIndex) => {
                    const dateKey = column.key;
                    const cellCount = getCellCount(rowIndex, dateKey, mode);
                    const colors = getHeatmapClasses(
                      cellCount,
                      maxHeatmapCount,
                      mode,
                    );
                    const hasVotes = cellCount > 0;
                    const inSelection =
                      isDragging && isInDragRectangle(rowIndex, dateIndex);

                    // Check if this cell is part of selected event times
                    const selectionState = getCellSelectionState(
                      row.slotIndices,
                      dateKey,
                    );
                    const isSelectedEventTime = selectionState !== "none";
                    const selectedBoundaries = getSelectedCellBoundaries(
                      rowIndex,
                      dateIndex,
                      row.slotIndices,
                      dateKey,
                      selectionState,
                    );

                    // Determine border classes for selection rectangle (drag selection)
                    let selectionBorderClasses = "";
                    if (isDragging && rectBounds && inSelection) {
                      const isTop = rowIndex === rectBounds.minRow;
                      const isBottom = rowIndex === rectBounds.maxRow;
                      const isLeft = dateIndex === rectBounds.minDate;
                      const isRight = dateIndex === rectBounds.maxDate;

                      const borders = [];
                      if (isTop) borders.push("border-t-2 border-t-blue-500");
                      if (isBottom)
                        borders.push("border-b-2 border-b-blue-500");
                      if (isLeft) borders.push("border-l-2 border-l-blue-500");
                      if (isRight) borders.push("border-r-2 border-r-blue-500");
                      selectionBorderClasses = borders.join(" ");
                    }

                    // Determine border classes for selected event times (persistent highlight)
                    let selectedEventTimeBorderClasses = "";
                    if (isSelectedEventTime && !inSelection) {
                      const borders = [];
                      const borderColorClass =
                        selectionState === "staged-add"
                          ? "border-orange-500 dark:border-orange-400"
                          : selectionState === "staged-remove"
                            ? "border-rose-300 dark:border-rose-700"
                            : "border-blue-500 dark:border-blue-400";
                      const borderStyleClass =
                        selectionState === "staged-add" ||
                        selectionState === "staged-remove"
                          ? "border-dashed"
                          : "";
                      if (selectedBoundaries.isTop)
                        borders.push(`border-t-2 ${borderColorClass}`);
                      if (selectedBoundaries.isBottom)
                        borders.push(`border-b-2 ${borderColorClass}`);
                      if (selectedBoundaries.isLeft)
                        borders.push(`border-l-2 ${borderColorClass}`);
                      if (selectedBoundaries.isRight)
                        borders.push(`border-r-2 ${borderColorClass}`);
                      if (borderStyleClass) borders.push(borderStyleClass);
                      selectedEventTimeBorderClasses = borders.join(" ");
                    }

                    return (
                      <div
                        key={`${dateKey}-${rowIndex}`}
                        data-cell
                        data-row={rowIndex}
                        data-date={dateIndex}
                        onClick={() =>
                          handleCellClick(column, rowIndex, row.slotIndices)
                        }
                        onMouseDown={(e) =>
                          handleMouseDown(rowIndex, dateIndex, e)
                        }
                        onTouchStart={(e) =>
                          handleTouchStart(rowIndex, dateIndex, e)
                        }
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`
                          flex-1 min-w-0 h-10 sm:h-11 relative
                          cursor-pointer transition-all duration-75
                          ${!inSelection && !isSelectedEventTime ? "border-r border-b border-gray-100 dark:border-zinc-800" : ""}
                          ${colors.bg}
                          ${inSelection ? `bg-blue-200 dark:bg-blue-800/50 ${selectionBorderClasses}` : ""}
                          ${isSelectedEventTime && !inSelection ? selectedEventTimeBorderClasses : ""}
                          ${!isDragging ? "hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:z-10" : ""}
                        `}
                      >
                        {/* Selected event time indicator */}
                        {isSelectedEventTime && !inSelection && (
                          <div
                            className={`absolute inset-0 pointer-events-none ${
                              selectionState === "staged-add"
                                ? "bg-orange-100/30 dark:bg-orange-900/15"
                                : selectionState === "staged-remove"
                                  ? "bg-rose-100/70 dark:bg-rose-900/10"
                                  : "bg-blue-100/35 dark:bg-blue-900/20"
                            }`}
                          />
                        )}

                        {/* Vote count */}
                        {hasVotes && !inSelection && (
                          <div
                            className={`
                              absolute inset-0 flex items-center justify-center pointer-events-none
                              text-xs sm:text-sm font-semibold
                              ${
                                isSelectedEventTime
                                  ? selectionState === "staged-add"
                                    ? "text-orange-700 dark:text-orange-300"
                                    : selectionState === "staged-remove"
                                      ? "text-rose-700 dark:text-rose-300"
                                      : "text-blue-700 dark:text-blue-300"
                                  : colors.text
                              }
                            `}
                          >
                            {cellCount}
                          </div>
                        )}
                        {inSelection && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {cellCount}
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
      </div>

      {/* Slot Detail Modal */}
      {modalData && (
        <SlotDetailModal
          isOpen={!!modalData}
          onClose={() => setModalData(null)}
          dateLabel={modalData.dateLabel}
          timeLabel={modalData.timeLabel}
          voters={modalData.voters}
          nonVoters={modalData.nonVoters}
          totalFiltered={selectedParticipants.size}
          mode={mode}
          canAddToEventTime={canAddToEventTime}
          isVotingPhase={isVotingPhase}
          rangeInfo={modalData.rangeInfo}
          onAddToEventTime={onAddToEventTime}
        />
      )}
    </div>
  );
}
