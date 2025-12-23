"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  TimeSlot,
  Vote,
  Participant,
  TimeGranularity,
  MergedTimeRow,
  SlotRangeInfo,
} from "./types";
import { getHeatmapClasses } from "./HeatMapLegend";
import { SlotDetailModal } from "./SlotDetailModal";
import { DatePagination } from "@/components/JoinedEventPage/VotingGrid/ui/DatePagination";
import {
  formatTime,
  formatDateHeader,
  groupSlotsByDate,
} from "@/components/JoinedEventPage/VotingGrid/utils";

interface ResultsHeatmapGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
  selectedParticipants: Set<string>;
  maxVotes: number;
  // Host-only props for adding time ranges to event time
  canAddToEventTime?: boolean;
  isVotingPhase?: boolean;
  onAddToEventTime?: (info: SlotRangeInfo, availableCount: number) => void;
}

interface CellPosition {
  rowIndex: number;
  dateIndex: number;
}

interface SelectionRange {
  cells: Array<{ dateKey: string; rowIndex: number; slotIndices: number[] }>;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
}

// Hook to calculate merged time rows based on granularity
function useMergedRows(
  timeSlots: TimeSlot[],
  granularity: TimeGranularity,
): MergedTimeRow[] {
  return useMemo(() => {
    if (timeSlots.length === 0) return [];
    if (granularity === 15) {
      return timeSlots.map((slot, index) => ({
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        slotIndices: [index],
        height: 1,
      }));
    }

    const result: MergedTimeRow[] = [];
    const startMinute = timeSlots[0].startMinute;
    const endMinute = timeSlots[timeSlots.length - 1].endMinute;

    const findNextAlignedMinute = (minute: number): number => {
      const remainder = minute % granularity;
      if (remainder === 0) return minute;
      return minute + (granularity - remainder);
    };

    const firstAlignedMinute = findNextAlignedMinute(startMinute);
    let currentMinute = startMinute;
    let currentSlotIndex = 0;

    // Handle leading remainder
    if (currentMinute < firstAlignedMinute && firstAlignedMinute <= endMinute) {
      const slotIndices: number[] = [];
      while (
        currentSlotIndex < timeSlots.length &&
        timeSlots[currentSlotIndex].startMinute < firstAlignedMinute
      ) {
        slotIndices.push(currentSlotIndex);
        currentSlotIndex++;
      }
      if (slotIndices.length > 0) {
        result.push({
          startMinute: currentMinute,
          endMinute: firstAlignedMinute,
          slotIndices,
          height: slotIndices.length,
        });
      }
      currentMinute = firstAlignedMinute;
    }

    // Handle main aligned chunks
    while (currentSlotIndex < timeSlots.length) {
      const chunkStartMinute = currentMinute;
      const chunkEndMinute = Math.min(currentMinute + granularity, endMinute);
      const slotsNeeded = granularity / 15;
      const remainingSlots = timeSlots.length - currentSlotIndex;

      if (
        remainingSlots >= slotsNeeded &&
        chunkEndMinute - chunkStartMinute === granularity
      ) {
        const slotIndices: number[] = [];
        for (let i = 0; i < slotsNeeded; i++) {
          slotIndices.push(currentSlotIndex + i);
        }
        result.push({
          startMinute: chunkStartMinute,
          endMinute: chunkEndMinute,
          slotIndices,
          height: slotsNeeded,
        });
        currentSlotIndex += slotsNeeded;
        currentMinute = chunkEndMinute;
      } else {
        const slotIndices: number[] = [];
        while (currentSlotIndex < timeSlots.length) {
          slotIndices.push(currentSlotIndex);
          currentSlotIndex++;
        }
        if (slotIndices.length > 0) {
          result.push({
            startMinute: chunkStartMinute,
            endMinute: timeSlots[slotIndices[slotIndices.length - 1]].endMinute,
            slotIndices,
            height: slotIndices.length,
          });
        }
        break;
      }
    }

    return result;
  }, [timeSlots, granularity]);
}

// Hook for responsive grid
function useResponsiveGrid() {
  const [datesPerPage, setDatesPerPage] = useState(7);
  const [slotHeight, setSlotHeight] = useState("2.75rem");

  useEffect(() => {
    const calculateValues = () => {
      const width = window.innerWidth;
      const isMobile = width < 640;

      let dates = 7;
      if (width < 400) dates = 5;
      else if (width < 640) dates = 5;
      else if (width < 768) dates = 6;
      else if (width < 1024) dates = 7;

      const height = isMobile ? "2.5rem" : "2.75rem";

      setDatesPerPage(dates);
      setSlotHeight(height);
    };

    calculateValues();
    window.addEventListener("resize", calculateValues);
    return () => window.removeEventListener("resize", calculateValues);
  }, []);

  return { datesPerPage, slotHeight };
}

export function ResultsHeatmapGrid({
  slots,
  votes,
  participants,
  selectedParticipants,
  maxVotes,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
}: ResultsHeatmapGridProps) {
  const t = useTranslations("joined");
  const locale = useLocale();
  const gridRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [granularity, setGranularity] = useState<TimeGranularity>(15);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<CellPosition | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Modal state
  const [modalData, setModalData] = useState<{
    dateLabel: string;
    timeLabel: string;
    voters: Vote[];
    nonVoters: Participant[];
    rangeInfo: SlotRangeInfo;
  } | null>(null);

  // Group slots by date
  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);
  const dates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const timeSlots = useMemo(
    () => (dates.length > 0 ? slotsByDate[dates[0]] : []),
    [dates, slotsByDate],
  );

  // Merged rows for granularity
  const mergedRows = useMergedRows(timeSlots, granularity);

  // Clamp currentPage to valid range
  const maxPage = Math.max(0, Math.ceil(dates.length / datesPerPage) - 1);
  const clampedCurrentPage = Math.min(currentPage, maxPage);

  // Paginated dates
  const paginatedDates = useMemo(() => {
    const startIdx = clampedCurrentPage * datesPerPage;
    return dates.slice(startIdx, startIdx + datesPerPage);
  }, [dates, clampedCurrentPage, datesPerPage]);

  // Filter votes based on selected participants
  const filteredVotes = useMemo(() => {
    if (selectedParticipants.size === 0) return [];
    return votes.filter((vote) => selectedParticipants.has(vote.userId));
  }, [votes, selectedParticipants]);

  // Group filtered votes by slot
  const votesBySlot = useMemo(() => {
    return filteredVotes.reduce(
      (acc, vote) => {
        if (!acc[vote.slotId]) acc[vote.slotId] = [];
        acc[vote.slotId].push(vote);
        return acc;
      },
      {} as Record<string, Vote[]>,
    );
  }, [filteredVotes]);

  // Get vote count for merged row (union of all voters across all slots)
  const getVoteCountForMergedRow = useCallback(
    (slotIndices: number[], dateKey: string): number => {
      const voterIds = new Set<string>();
      slotIndices.forEach((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        if (slot) {
          const slotVotes = votesBySlot[slot.id] || [];
          slotVotes.forEach((v) => voterIds.add(v.userId));
        }
      });
      return voterIds.size;
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

  // Calculate rectangle bounds from drag start/end
  const getRectangleBounds = useCallback(() => {
    if (!dragStart || !dragEnd) return null;
    return {
      minRow: Math.min(dragStart.rowIndex, dragEnd.rowIndex),
      maxRow: Math.max(dragStart.rowIndex, dragEnd.rowIndex),
      minDate: Math.min(dragStart.dateIndex, dragEnd.dateIndex),
      maxDate: Math.max(dragStart.dateIndex, dragEnd.dateIndex),
    };
  }, [dragStart, dragEnd]);

  // Check if a cell is in the drag rectangle
  const isInDragRectangle = useCallback(
    (rowIndex: number, dateIndex: number): boolean => {
      const bounds = getRectangleBounds();
      if (!bounds) return false;
      return (
        rowIndex >= bounds.minRow &&
        rowIndex <= bounds.maxRow &&
        dateIndex >= bounds.minDate &&
        dateIndex <= bounds.maxDate
      );
    },
    [getRectangleBounds],
  );

  // Get cell position from touch/mouse coordinates
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): CellPosition | null => {
      if (!gridRef.current) return null;

      const gridElement = gridRef.current.querySelector('[data-grid="slots"]');
      if (!gridElement) return null;

      const cells = gridElement.querySelectorAll("[data-cell]");
      for (const cell of cells) {
        const rect = cell.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          const rowIndex = parseInt(cell.getAttribute("data-row") || "0", 10);
          const dateIndex = parseInt(cell.getAttribute("data-date") || "0", 10);
          return { rowIndex, dateIndex };
        }
      }
      return null;
    },
    [],
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

  // Get selection range data
  const getSelectionRange = useCallback((): SelectionRange | null => {
    const bounds = getRectangleBounds();
    if (!bounds) return null;

    const cells: SelectionRange["cells"] = [];
    const dateKeys: string[] = [];

    for (let dateIdx = bounds.minDate; dateIdx <= bounds.maxDate; dateIdx++) {
      const dateKey = paginatedDates[dateIdx];
      if (!dateKey) continue;
      dateKeys.push(dateKey);

      for (let rowIdx = bounds.minRow; rowIdx <= bounds.maxRow; rowIdx++) {
        const row = mergedRows[rowIdx];
        if (!row) continue;
        cells.push({
          dateKey,
          rowIndex: rowIdx,
          slotIndices: row.slotIndices,
        });
      }
    }

    if (cells.length === 0) return null;

    const startRow = mergedRows[bounds.minRow];
    const endRow = mergedRows[bounds.maxRow];

    return {
      cells,
      startDate: dateKeys[0],
      endDate: dateKeys[dateKeys.length - 1],
      startTime: startRow?.startMinute ?? 0,
      endTime: endRow?.endMinute ?? 0,
    };
  }, [getRectangleBounds, paginatedDates, mergedRows]);

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
      const timeLabel = `${formatTime(range.startTime)} - ${formatTime(range.endTime)}`;

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

  // Handle single cell click
  const handleCellClick = useCallback(
    (dateKey: string, rowIndex: number, slotIndices: number[]) => {
      // Don't trigger click if we just finished dragging
      if (hasDraggedRef.current) {
        hasDraggedRef.current = false;
        return;
      }

      const row = mergedRows[rowIndex];
      if (!row) return;

      const range: SelectionRange = {
        cells: [{ dateKey, rowIndex, slotIndices }],
        startDate: dateKey,
        endDate: dateKey,
        startTime: row.startMinute,
        endTime: row.endMinute,
      };

      showModalForSelection(range);
    },
    [mergedRows, showModalForSelection],
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (rowIndex: number, dateIndex: number, e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      hasDraggedRef.current = false;
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragStart || !touchStartRef.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // Start dragging if moved more than threshold
      if (dx > 10 || dy > 10) {
        if (!isDragging) {
          setIsDragging(true);
          hasDraggedRef.current = true;
        }

        const cell = getCellFromPoint(touch.clientX, touch.clientY);
        if (cell) {
          setDragEnd(cell);
        }
      }
    },
    [dragStart, isDragging, getCellFromPoint],
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      const range = getSelectionRange();
      if (range) {
        showModalForSelection(range);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    touchStartRef.current = null;
  }, [isDragging, getSelectionRange, showModalForSelection]);

  // Mouse handlers for desktop drag
  const handleMouseDown = useCallback(
    (rowIndex: number, dateIndex: number, e: React.MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      e.preventDefault();

      touchStartRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStart || !touchStartRef.current) return;

      const dx = Math.abs(e.clientX - touchStartRef.current.x);
      const dy = Math.abs(e.clientY - touchStartRef.current.y);

      if (dx > 5 || dy > 5) {
        if (!isDragging) {
          setIsDragging(true);
          hasDraggedRef.current = true;
        }

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (cell) {
          setDragEnd(cell);
        }
      }
    },
    [dragStart, isDragging, getCellFromPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      const range = getSelectionRange();
      if (range) {
        showModalForSelection(range);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    touchStartRef.current = null;
  }, [isDragging, getSelectionRange, showModalForSelection]);

  // Get rectangle bounds for visual styling
  const rectBounds = getRectangleBounds();

  return (
    <div className="space-y-4">
      {/* Granularity Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {t("results.granularity")}
        </span>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
          {([15, 30, 60] as TimeGranularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                granularity === g
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {g}m
            </button>
          ))}
        </div>
      </div>

      {/* Date Pagination */}
      <DatePagination
        dates={dates}
        currentPage={clampedCurrentPage}
        datesPerPage={datesPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Grid */}
      <div
        ref={gridRef}
        className="select-none touch-none"
        style={{ "--slot-height": slotHeight } as React.CSSProperties}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative">
          {/* Date headers */}
          <div className="flex">
            <div className="w-9 sm:w-14 shrink-0" />
            {paginatedDates.map((dateKey) => {
              const { weekday, day, month } = formatDateHeader(dateKey, locale);
              return (
                <div
                  key={dateKey}
                  className="flex-1 min-w-0 p-1 sm:p-2 text-center mx-px sm:mx-0.5"
                >
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 font-medium">
                    {weekday}
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-zinc-100">
                    {day}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 dark:text-zinc-500">
                    {month}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots grid */}
          <div className="flex">
            {/* Time column */}
            <div className="w-9 sm:w-14 shrink-0 relative border-r border-gray-200 dark:border-zinc-700 rounded-l-lg">
              {mergedRows.map((row, rowIndex) => (
                <div key={rowIndex} className="h-10 sm:h-11 relative">
                  <span className="absolute -top-2 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                    {formatTime(row.startMinute)}
                  </span>
                </div>
              ))}
              {mergedRows.length > 0 && (
                <span className="absolute bottom-0.5 left-0 right-1 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-zinc-400 text-right leading-none">
                  {formatTime(mergedRows[mergedRows.length - 1].endMinute)}
                </span>
              )}
            </div>

            {/* Slots grid */}
            <div
              data-grid="slots"
              className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
            >
              {mergedRows.map((row, rowIndex) => (
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

                    // Determine border classes for selection rectangle
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
                          ${!inSelection ? "border-r border-b border-gray-100 dark:border-zinc-800" : ""}
                          ${colors.bg}
                          ${inSelection ? `bg-blue-200 dark:bg-blue-800/50 ${selectionBorderClasses}` : ""}
                          ${!isDragging ? "hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 hover:z-10" : ""}
                        `}
                      >
                        {/* Vote count */}
                        {hasVotes && !inSelection && (
                          <div
                            className={`
                              absolute inset-0 flex items-center justify-center
                              text-xs sm:text-sm font-semibold
                              ${colors.text}
                            `}
                          >
                            {voteCount}
                          </div>
                        )}
                        {inSelection && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">
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
          onAddToEventTime={
            onAddToEventTime
              ? (info) => onAddToEventTime(info, modalData.voters.length)
              : undefined
          }
        />
      )}
    </div>
  );
}
