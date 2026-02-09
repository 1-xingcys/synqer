"use client";

import { useState, useMemo, useCallback } from "react";
import { Vote, TimeGranularity, VotingGridProps } from "../types";
import { useCalendarConflictSyncApi } from "./useCalendarConflictSyncApi";
import { useMergedTimeGridSelectionInteraction } from "./useMergedTimeGridSelectionInteraction";
import { useMergedTimeRowsModel } from "./useMergedTimeRowsModel";
import { useResponsiveGrid } from "./useResponsiveGrid";
import { usePaginatedDates } from "./usePaginatedDates";
import { useOptimisticVoting } from "./useOptimisticVoting";
import { useCalendarOverlayProjection } from "./useCalendarOverlayProjection";
import { useSlotMatrixViewModel } from "./useSlotMatrixViewModel";
import { useSlotGridModel } from "./useSlotGridModel";
import { useSlotSelectionModel } from "./useSlotSelectionModel";
import { groupVotesBySlot } from "../utils";
import { VoteMode } from "@/types/event";

interface UseVotingGridControllerProps {
  slots: VotingGridProps["slots"];
  votes: VotingGridProps["votes"];
  eventId: VotingGridProps["eventId"];
  currentUserId: VotingGridProps["currentUserId"];
  currentUserDisplayName: VotingGridProps["currentUserDisplayName"];
}

interface UseVotingGridControllerResult {
  // top-level controls
  granularity: TimeGranularity;
  setGranularity: (granularity: TimeGranularity) => void;
  voteMode: VoteMode;
  setVoteMode: (mode: VoteMode) => void;
  selectedCount: number;
  clearSelection: () => void;
  selectAll: () => void;

  // pagination / grid structure
  dates: string[];
  paginatedDates: string[];
  currentPage: number;
  datesPerPage: number;
  handlePageChange: (newPage: number) => void;
  slotHeight: string;
  mergedTimeRows: ReturnType<typeof useMergedTimeRowsModel>["mergedTimeRows"];
  slotMatrixRows: ReturnType<typeof useSlotMatrixViewModel>;
  mergedRectBounds: ReturnType<
    typeof useMergedTimeGridSelectionInteraction
  >["getRectangleBounds"] extends (...args: never[]) => infer R
    ? R
    : never;

  // day/grid actions
  isDayFullySelected: (dateKey: string) => boolean;
  selectEntireDay: (dateKey: string) => void;
  handleGridMouseUp: () => void;
  handleGridMouseLeave: () => void;

  // drag/cell interactions
  isDragging: boolean;
  handleMergedMouseDown: (
    rowIndex: number,
    dateIndex: number,
    e: React.MouseEvent,
  ) => void;
  handleMergedMouseEnter: (rowIndex: number, dateIndex: number) => void;
  handleMergedTouchStart: (
    rowIndex: number,
    dateIndex: number,
    e: React.TouchEvent,
  ) => void;
  handleMergedTouchMove: (e: React.TouchEvent) => void;
  handleMergedTouchEnd: () => void;
  handleMergedClick: (rowIndex: number, dateIndex: number) => void;

  // calendar panel / legend
  calendarStatus: { connected: boolean; googleEmail?: string } | null;
  calendarLoading: boolean;
  calendarEvents: ReturnType<
    typeof useCalendarConflictSyncApi
  >["calendarEvents"];
  conflictingSlotIds: string[];
  loadingCalendar: boolean;
  showCalendarOnGrid: boolean;
  setShowCalendarOnGrid: (show: boolean) => void;
  connectCalendar: () => void;
  disconnectCalendar: () => Promise<void>;
  markConflictsAsUnavailable: () => void;
}

/**
 * TimeGrid 的編排層 controller：
 * 串接各子 hooks，對外提供畫面需要的狀態、衍生資料與互動 handler。
 */
export function useVotingGridController({
  slots,
  votes,
  eventId,
  currentUserId,
  currentUserDisplayName,
}: UseVotingGridControllerProps): UseVotingGridControllerResult {
  const [granularity, setGranularity] = useState<TimeGranularity>(15);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  const { selectedSlots, toggleSlots, replaceAllSlots } = useOptimisticVoting({
    eventId,
    currentUserId,
    currentUserDisplayName,
    votes,
  });

  const { slotsByDate, dates, timeSlots } = useSlotGridModel({ slots });

  const {
    voteMode,
    setVoteMode,
    displaySelection: modeDisplaySelection,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  } = useSlotSelectionModel({
    slots,
    slotsByDate,
    selectedSlots,
    onSelectionCommit: toggleSlots,
    onReplaceAll: replaceAllSlots,
  });

  const { mergedTimeRows } = useMergedTimeRowsModel({
    timeSlots,
    granularity,
  });

  const { paginatedDates, currentPage, setCurrentPage } = usePaginatedDates({
    dates,
    datesPerPage,
  });

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
  } = useMergedTimeGridSelectionInteraction({
    selectedSlots: modeDisplaySelection,
    mergedTimeRows,
    slotsByDate,
    paginatedDates,
    onSelectionCommit: commitDisplaySelectionChange,
  });

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
  } = useCalendarConflictSyncApi({ eventId, slots });

  const { getCalendarProjectionForCell } = useCalendarOverlayProjection({
    mergedTimeRows,
    paginatedDates,
    slotsByDate,
    calendarEventsForSlot,
  });

  const votesBySlot = useMemo(() => groupVotesBySlot(votes), [votes]);

  const getVotersForSlot = useCallback(
    (slotId: string): string[] => {
      return (votesBySlot[slotId] || []).map((v: Vote) => v.userDisplayName);
    },
    [votesBySlot],
  );

  const getVotersForMergedRow = useCallback(
    (slotIndices: number[], dateKey: string): string[] => {
      const allVoters = new Set<string>();
      slotIndices.forEach((idx) => {
        const slot = slotsByDate[dateKey]?.[idx];
        if (!slot) return;

        const voters = getVotersForSlot(slot.id);
        voters.forEach((v) => allVoters.add(v));
      });
      return Array.from(allVoters);
    },
    [slotsByDate, getVotersForSlot],
  );

  const slotMatrixRows = useSlotMatrixViewModel({
    mergedTimeRows,
    paginatedDates,
    slotsByDate,
    displaySelection,
    hoveredCell,
    longPressCell,
    isInDragRectangle,
    getVotersForMergedRow,
    getCalendarProjectionForCell,
  });

  const mergedRectBounds = getMergedRectangleBounds();

  const markConflictsAsUnavailable = useCallback(() => {
    applyConflicts(conflictingSlotIds);
  }, [applyConflicts, conflictingSlotIds]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
    },
    [setCurrentPage],
  );

  const handleGridMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, [setHoveredCell]);

  return {
    granularity,
    setGranularity,
    voteMode,
    setVoteMode,
    selectedCount: displaySelection.size,
    clearSelection,
    selectAll,
    dates,
    paginatedDates,
    currentPage,
    datesPerPage,
    handlePageChange,
    slotHeight,
    mergedTimeRows,
    slotMatrixRows,
    mergedRectBounds,
    isDayFullySelected,
    selectEntireDay,
    handleGridMouseUp: handleMergedMouseUp,
    handleGridMouseLeave,
    isDragging,
    handleMergedMouseDown,
    handleMergedMouseEnter,
    handleMergedTouchStart,
    handleMergedTouchMove,
    handleMergedTouchEnd,
    handleMergedClick,
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
  };
}
