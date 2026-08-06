"use client";

import { useState, useMemo, useCallback } from "react";
import { VotingGridProps } from "../../types";
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
import { useSlotCellDataProjection } from "./useSlotCellDataProjection";
import { useSlotMatrixViewModel } from "./useSlotMatrixViewModel";
import { useSlotGridModel } from "../../hooks/useSlotGridModel";
import { useSlotSelectionModel } from "./useSlotSelectionModel";
import { groupVotesBySlot } from "../../utils";
import {
  EventCapabilities,
  VoteMode,
  type TimeGranularity,
} from "@/types/event";
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
  defaultGranularity: VotingGridProps["defaultGranularity"];
  defaultVoteMode: VotingGridProps["defaultVoteMode"];
  shareVoteToChat: VotingGridProps["shareVoteToChat"];
}

interface UseVotingGridControllerResult {
  selection: {
    voteMode: VoteMode;
    setVoteMode: (mode: VoteMode) => void;
    clearSelection: () => void;
    selectAll: () => void;
    hasStagedVoteDraft: boolean;
    commitStagedVotes: () => void;
    isCommitting: boolean;
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
    isDragging: boolean;
    handleGridMouseUp: () => void;
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
 * Orchestration controller for the TimeGrid:
 * wires the child hooks together and exposes the state, derived data and
 * interaction handlers the view needs.
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
  defaultGranularity,
  defaultVoteMode,
  shareVoteToChat,
}: UseVotingGridControllerProps): UseVotingGridControllerResult {
  const [granularity, setGranularity] =
    useState<TimeGranularity>(defaultGranularity);
  const { datesPerPage, slotHeight } = useResponsiveGrid();

  const {
    committedSlots,
    stagedSlots,
    hasStagedVoteDraft,
    commitFeedback,
    updateStagedVotes,
    commitStagedVotes,
    isCommitting,
  } = useOptimisticVoting({
    eventId,
    currentUserId,
    eventTitle,
    votes,
    stagedVote,
    shareVoteToChat,
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
    initialVoteMode: defaultVoteMode,
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
    displaySelection,
    dragRect,
    handleMouseDown: handleMergedMouseDown,
    handleMouseEnter: handleMergedMouseEnter,
    handleMouseUp: handleMergedMouseUp,
    handleTouchStart: handleMergedTouchStart,
    handleTouchMove: handleMergedTouchMove,
    handleTouchEnd: handleMergedTouchEnd,
    handleClick: handleMergedClick,
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

  const { getCellData } = useSlotCellDataProjection({
    mergedTimeRows,
    paginatedDates,
    slotsByDate,
    votesBySlot,
  });

  const slotMatrixRows = useSlotMatrixViewModel({
    mergedTimeRows,
    paginatedDates,
    slotsByDate,
    displaySelection,
    committedDisplaySelection,
    hasStagedVoteDraft,
    dragRect,
    getCellData,
    getCalendarProjectionForCell,
  });

  const markConflictsAsUnavailable = useCallback(() => {
    applyConflicts(conflictingSlotIds);
  }, [applyConflicts, conflictingSlotIds]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
    },
    [setCurrentPage],
  );

  return {
    selection: {
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
      isDragging,
      handleGridMouseUp: handleMergedMouseUp,
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
