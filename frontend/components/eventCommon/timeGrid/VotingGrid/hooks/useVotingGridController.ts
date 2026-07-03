"use client";

import { useState, useMemo, useCallback } from "react";
import { Vote, TimeGranularity, VotingGridProps } from "../../types";
import { useCalendarConflictSyncApi } from "./useCalendarConflictSyncApi";
import { useMergedTimeGridSelectionInteraction } from "./useMergedTimeGridSelectionInteraction";
import { useMergedTimeRowsModel } from "../../hooks/useMergedTimeRowsModel";
import { useResponsiveGrid } from "../../hooks/useResponsiveGrid";
import { usePaginatedDates } from "../../hooks/usePaginatedDates";
import {
  useOptimisticVoting,
  type CommitFeedback,
} from "./useOptimisticVoting";
import { useCalendarOverlayProjection } from "./useCalendarOverlayProjection";
import { useSlotMatrixViewModel } from "./useSlotMatrixViewModel";
import { useSlotGridModel } from "../../hooks/useSlotGridModel";
import { useSlotSelectionModel } from "./useSlotSelectionModel";
import { groupVotesBySlot } from "../../utils";
import { EventCapabilities, VoteMode } from "@/types/event";
import { GridAxisColumn } from "../../types";

interface UseVotingGridControllerProps {
  slots: VotingGridProps["slots"];
  votes: VotingGridProps["votes"];
  stagedVote: VotingGridProps["stagedVote"];
  currentUserHasVoted: VotingGridProps["currentUserHasVoted"];
  eventId: VotingGridProps["eventId"];
  currentUserId: VotingGridProps["currentUserId"];
  eventTitle: VotingGridProps["eventTitle"];
  timeZone: VotingGridProps["timeZone"];
  capabilities: EventCapabilities;
}

interface UseVotingGridControllerResult {
  selection: {
    voteMode: VoteMode;
    setVoteMode: (mode: VoteMode) => void;
    clearSelection: () => void;
    selectAll: () => void;
    hasStagedVoteDraft: boolean;
    commitStagedVotes: () => void;
    isPatchPending: boolean;
    isCommitPending: boolean;
    commitFeedback: CommitFeedback;
    isDayFullySelected: (dateKey: string) => boolean;
    selectEntireDay: (dateKey: string) => void;
  };
  pagination: {
    columns: GridAxisColumn[];
    dates: string[];
    paginatedDates: string[];
    currentPage: number;
    datesPerPage: number;
    handlePageChange: (newPage: number) => void;
  };
  matrix: {
    granularity: TimeGranularity;
    setGranularity: (granularity: TimeGranularity) => void;
    slotHeight: string;
    mergedTimeRows: ReturnType<typeof useMergedTimeRowsModel>["mergedTimeRows"];
    slotMatrixRows: ReturnType<typeof useSlotMatrixViewModel>;
    mergedRectBounds: ReturnType<
      typeof useMergedTimeGridSelectionInteraction
    >["getRectangleBounds"] extends (...args: never[]) => infer R
      ? R
      : never;
    isDragging: boolean;
    handleGridMouseUp: () => void;
    handleGridMouseLeave: () => void;
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
  };
  calendar: {
    calendarStatus: { connected: boolean; googleEmail?: string } | null;
    calendarLoading: boolean;
    calendarEvents: ReturnType<
      typeof useCalendarConflictSyncApi
    >["calendarEvents"];
    conflictingSlotIds: string[];
    loadingCalendar: boolean;
    showCalendarOnGrid: boolean;
    setShowCalendarOnGrid: (show: boolean) => void;
    isCalendarSupported: boolean;
    connectCalendar: () => void;
    disconnectCalendar: () => Promise<void>;
    markConflictsAsUnavailable: () => void;
  };
}

/**
 * TimeGrid 的編排層 controller：
 * 串接各子 hooks，對外提供畫面需要的狀態、衍生資料與互動 handler。
 */
export function useVotingGridController({
  slots,
  votes,
  stagedVote,
  currentUserHasVoted,
  eventId,
  currentUserId,
  eventTitle,
  timeZone,
  capabilities,
}: UseVotingGridControllerProps): UseVotingGridControllerResult {
  const [granularity, setGranularity] = useState<TimeGranularity>(30);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  const {
    committedSlots,
    stagedSlots,
    hasStagedVoteDraft,
    commitFeedback,
    updateStagedVotes,
    commitStagedVotes,
    isPatchPending,
    isCommitPending,
  } = useOptimisticVoting({
    eventId,
    currentUserId,
    eventTitle,
    votes,
    stagedVote,
  });

  const { slotsByDate, dates, columns, timeSlots } = useSlotGridModel({
    slots,
  });

  const {
    voteMode,
    setVoteMode,
    displaySelection: modeDisplaySelection,
    committedDisplaySelection,
    commitDisplaySelectionChange,
    selectEntireDay,
    clearSelection,
    selectAll,
    applyConflicts,
    isDayFullySelected,
  } = useSlotSelectionModel({
    slots,
    slotsByDate,
    committedSlots,
    stagedSlots,
    hasStagedVoteDraft,
    hasVoted: currentUserHasVoted,
    onSelectionCommit: updateStagedVotes,
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
  } = useCalendarConflictSyncApi({
    eventId,
    slots,
    timeZone,
    enabled: capabilities.supportsCalendarConflict,
  });

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
    committedDisplaySelection,
    hasStagedVoteDraft,
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
    selection: {
      voteMode,
      setVoteMode,
      clearSelection,
      selectAll,
      hasStagedVoteDraft,
      commitStagedVotes,
      isPatchPending,
      isCommitPending,
      commitFeedback,
      isDayFullySelected,
      selectEntireDay,
    },
    pagination: {
      columns,
      dates,
      paginatedDates,
      currentPage,
      datesPerPage,
      handlePageChange,
    },
    matrix: {
      granularity,
      setGranularity,
      slotHeight,
      mergedTimeRows,
      slotMatrixRows,
      mergedRectBounds,
      isDragging,
      handleGridMouseUp: handleMergedMouseUp,
      handleGridMouseLeave,
      handleMergedMouseDown,
      handleMergedMouseEnter,
      handleMergedTouchStart,
      handleMergedTouchMove,
      handleMergedTouchEnd,
      handleMergedClick,
    },
    calendar: {
      calendarStatus,
      calendarLoading,
      calendarEvents,
      conflictingSlotIds,
      loadingCalendar,
      showCalendarOnGrid,
      setShowCalendarOnGrid,
      isCalendarSupported: capabilities.supportsCalendarConflict,
      connectCalendar,
      disconnectCalendar,
      markConflictsAsUnavailable,
    },
  };
}
