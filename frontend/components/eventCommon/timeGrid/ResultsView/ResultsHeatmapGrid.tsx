"use client";

import { useState, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { SlotRangeInfo } from "./types";
import { getHeatmapClasses } from "./HeatMapLegend";
import { SlotDetailModal } from "./SlotDetailModal";
import { ResultsGridToolsMenu } from "./ResultsGridToolsMenu";
import {
  DateHeader,
  DatePagination,
  TimeColumn,
} from "@/components/eventCommon/timeGrid/ui";
import { formatMinutesToTime } from "@/lib/utils";
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
  // Host-only props for adding time ranges to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo) => Promise<boolean>;
  // Selected slot IDs to display with border highlight
  selectedSlotIds?: Set<string>;
  onCopyShareLink: () => void;
  linkCopied: boolean;
}

export function ResultsHeatmapGrid({
  slots,
  votesBySlot,
  participants,
  selectedParticipants,
  maxVotes,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  selectedSlotIds,
  onCopyShareLink,
  linkCopied,
}: ResultsHeatmapGridProps) {
  const locale = useLocale();
  const gridRef = useRef<HTMLDivElement>(null);
  const [granularity, setGranularity] = useState<TimeGranularity>(15);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  // Modal state
  const [modalData, setModalData] = useState<{
    dateLabel: string;
    timeLabel: string;
    voters: Vote[];
    nonVoters: Participant[];
    rangeInfo: SlotRangeInfo;
  } | null>(null);

  const { slotsByDate, dates, timeSlots } = useSlotGridModel({ slots });

  // Merged rows for granularity (using shared hook)
  const { mergedTimeRows } = useMergedTimeRowsModel({ timeSlots, granularity });

  // Use paginated dates hook (handles page clamping automatically)
  const { paginatedDates, currentPage, setCurrentPage } = usePaginatedDates({
    dates,
    datesPerPage,
  });

  // Get vote count for merged row (intersection - voters available for ALL slots in the merged row)
  const getVoteCountForMergedRow = useCallback(
    (slotIndices: number[], dateKey: string): number => {
      if (slotIndices.length === 0) return 0;

      // Get all slot IDs for this merged row
      const slotIds: string[] = [];
      slotIndices.forEach((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        if (slot) slotIds.push(slot.id);
      });

      if (slotIds.length === 0) return 0;

      // Count how many times each voter appears across all slots
      const voterCounts = new Map<string, number>();
      slotIds.forEach((slotId) => {
        const slotVotes = votesBySlot[slotId] || [];
        slotVotes.forEach((vote) => {
          voterCounts.set(vote.userId, (voterCounts.get(vote.userId) || 0) + 1);
        });
      });

      // Only count voters who are available for ALL slots in the merged row
      const totalSlots = slotIds.length;
      let count = 0;
      voterCounts.forEach((voteCount) => {
        if (voteCount === totalSlots) {
          count++;
        }
      });

      return count;
    },
    [slotsByDate, votesBySlot],
  );

  // Get voters for a selection range (intersection - available for ALL selected slots)
  const getVotersForRange = useCallback(
    (cells: SelectionRange["cells"]): Vote[] => {
      if (cells.length === 0) return [];

      // Get all slot IDs in the range
      const allSlotIds: string[] = [];
      cells.forEach(({ dateKey, slotIndices }) => {
        slotIndices.forEach((idx) => {
          const slot = slotsByDate[dateKey]?.[idx];
          if (slot) allSlotIds.push(slot.id);
        });
      });

      if (allSlotIds.length === 0) return [];

      // Find voters who voted for ALL slots in the range
      const voterCounts = new Map<string, { vote: Vote; count: number }>();
      allSlotIds.forEach((slotId) => {
        const slotVotes = votesBySlot[slotId] || [];
        slotVotes.forEach((vote) => {
          const existing = voterCounts.get(vote.userId);
          if (existing) {
            existing.count++;
          } else {
            voterCounts.set(vote.userId, { vote, count: 1 });
          }
        });
      });

      // Return only voters who are available for ALL slots
      const totalSlots = allSlotIds.length;
      return Array.from(voterCounts.values())
        .filter(({ count }) => count === totalSlots)
        .map(({ vote }) => vote);
    },
    [slotsByDate, votesBySlot],
  );

  // Get non-voters for a selection range
  const getNonVotersForRange = useCallback(
    (cells: SelectionRange["cells"]): Participant[] => {
      const voters = getVotersForRange(cells);
      const voterIds = new Set(voters.map((v) => v.userId));
      return participants.filter(
        (p) => selectedParticipants.has(p.userId) && !voterIds.has(p.userId),
      );
    },
    [getVotersForRange, participants, selectedParticipants],
  );

  // Check if a merged row cell contains any selected slots
  const isMergedCellSelected = useCallback(
    (slotIndices: number[], dateKey: string): boolean => {
      if (!selectedSlotIds || selectedSlotIds.size === 0) return false;
      return slotIndices.some((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        return slot && selectedSlotIds.has(slot.id);
      });
    },
    [slotsByDate, selectedSlotIds],
  );

  // Get selected cell boundaries for border rendering
  const getSelectedCellBoundaries = useCallback(
    (
      rowIndex: number,
      dateIndex: number,
      slotIndices: number[],
      dateKey: string,
    ): {
      isTop: boolean;
      isBottom: boolean;
      isLeft: boolean;
      isRight: boolean;
    } => {
      if (!selectedSlotIds || selectedSlotIds.size === 0) {
        return { isTop: false, isBottom: false, isLeft: false, isRight: false };
      }

      const isSelected = isMergedCellSelected(slotIndices, dateKey);
      if (!isSelected) {
        return { isTop: false, isBottom: false, isLeft: false, isRight: false };
      }

      // Check adjacent cells
      const checkAdjacentSelected = (rIdx: number, dIdx: number): boolean => {
        const adjDateKey = paginatedDates[dIdx];
        const adjRow = mergedTimeRows[rIdx];
        if (!adjDateKey || !adjRow) return false;
        return isMergedCellSelected(adjRow.slotIndices, adjDateKey);
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
    [selectedSlotIds, isMergedCellSelected, paginatedDates, mergedTimeRows],
  );

  // Format date for modal
  const formatDateForModal = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      const dateLocale = locale === "zh-TW" ? "zh-TW" : "en-US";
      return date.toLocaleDateString(dateLocale, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    },
    [locale],
  );

  // Get all slot IDs from selection range cells
  const getSlotIdsFromCells = useCallback(
    (cells: SelectionRange["cells"]): string[] => {
      const slotIds: string[] = [];
      cells.forEach(({ dateKey, slotIndices }) => {
        slotIndices.forEach((idx) => {
          const slot = slotsByDate[dateKey]?.[idx];
          if (slot) slotIds.push(slot.id);
        });
      });
      return slotIds;
    },
    [slotsByDate],
  );

  // Show modal with selection data
  const showModalForSelection = useCallback(
    (range: SelectionRange) => {
      const voters = getVotersForRange(range.cells);
      const nonVoters = getNonVotersForRange(range.cells);
      const slotIds = getSlotIdsFromCells(range.cells);

      // Format date label
      let dateLabel: string;
      if (range.startDate === range.endDate) {
        dateLabel = formatDateForModal(range.startDate);
      } else {
        dateLabel = `${formatDateForModal(range.startDate)} ~ ${formatDateForModal(range.endDate)}`;
      }

      // Format time label
      const timeLabel = `${formatMinutesToTime(range.startTime)} - ${formatMinutesToTime(range.endTime)}`;

      setModalData({
        dateLabel,
        timeLabel,
        voters,
        nonVoters,
        rangeInfo: {
          startDate: range.startDate,
          endDate: range.endDate,
          startTime: range.startTime,
          endTime: range.endTime,
          slotIds,
        },
      });
    },
    [
      getVotersForRange,
      getNonVotersForRange,
      getSlotIdsFromCells,
      formatDateForModal,
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
    paginatedDates,
    onRangeSelect: showModalForSelection,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <DatePagination
            dates={dates}
            currentPage={currentPage}
            datesPerPage={datesPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
        <ResultsGridToolsMenu
          granularity={granularity}
          onGranularityChange={setGranularity}
          onCopyShareLink={onCopyShareLink}
          linkCopied={linkCopied}
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
          <DateHeader dates={paginatedDates} selectable={false} />

          {/* Time slots grid */}
          <div className="flex touch-pan-y">
            <TimeColumn
              mergedTimeRows={mergedTimeRows}
              slotHeight={slotHeight}
            />

            {/* Slots grid */}
            <div
              data-grid="slots"
              className="flex-1 touch-none border border-gray-200 dark:border-zinc-700 overflow-hidden"
            >
              {mergedTimeRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {paginatedDates.map((dateKey, dateIndex) => {
                    const voteCount = getVoteCountForMergedRow(
                      row.slotIndices,
                      dateKey,
                    );
                    const colors = getHeatmapClasses(voteCount, maxVotes);
                    const hasVotes = voteCount > 0;
                    const inSelection =
                      isDragging && isInDragRectangle(rowIndex, dateIndex);

                    // Check if this cell is part of selected event times
                    const isSelectedEventTime = isMergedCellSelected(
                      row.slotIndices,
                      dateKey,
                    );
                    const selectedBoundaries = getSelectedCellBoundaries(
                      rowIndex,
                      dateIndex,
                      row.slotIndices,
                      dateKey,
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
                      if (selectedBoundaries.isTop)
                        borders.push(
                          "border-t-2 border-t-orange-500 dark:border-t-orange-400",
                        );
                      if (selectedBoundaries.isBottom)
                        borders.push(
                          "border-b-2 border-b-orange-500 dark:border-b-orange-400",
                        );
                      if (selectedBoundaries.isLeft)
                        borders.push(
                          "border-l-2 border-l-orange-500 dark:border-l-orange-400",
                        );
                      if (selectedBoundaries.isRight)
                        borders.push(
                          "border-r-2 border-r-orange-500 dark:border-r-orange-400",
                        );
                      selectedEventTimeBorderClasses = borders.join(" ");
                    }

                    return (
                      <div
                        key={`${dateKey}-${rowIndex}`}
                        data-cell
                        data-row={rowIndex}
                        data-date={dateIndex}
                        onClick={() =>
                          handleCellClick(dateKey, rowIndex, row.slotIndices)
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
                          <div className="absolute inset-0 bg-orange-100/50 dark:bg-orange-900/30 pointer-events-none" />
                        )}

                        {/* Vote count */}
                        {hasVotes && !inSelection && (
                          <div
                            className={`
                              absolute inset-0 flex items-center justify-center pointer-events-none
                              text-xs sm:text-sm font-semibold
                              ${isSelectedEventTime ? "text-orange-700 dark:text-orange-300" : colors.text}
                            `}
                          >
                            {voteCount}
                          </div>
                        )}
                        {inSelection && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {voteCount}
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
          canAddToEventTime={canAddToEventTime}
          isVotingPhase={isVotingPhase}
          rangeInfo={modalData.rangeInfo}
          onAddToEventTime={onAddToEventTime}
        />
      )}
    </div>
  );
}
