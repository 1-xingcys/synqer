"use client";

import { useCallback, useMemo } from "react";
import { MergedTimeRow, Participant, TimeSlot, Vote } from "../../types";
import { ResultsAvailabilityMode } from "../types";

type SlotsByDate = Record<string, TimeSlot[]>;
type RangeCell = { dateKey: string; slotIndices: number[] };

interface UseResultsAvailabilityMetricsProps {
  slotsByDate: SlotsByDate;
  dates: string[];
  mergedTimeRows: MergedTimeRow[];
  votesBySlot: Record<string, Vote[]>;
  participants: Participant[];
  selectedParticipants: Set<string>;
}

interface UseResultsAvailabilityMetricsResult {
  getCellCount: (
    rowIndex: number,
    dateKey: string,
    mode: ResultsAvailabilityMode,
  ) => number;
  getAvailableVotesForRange: (cells: RangeCell[]) => Vote[];
  getUnavailableParticipantsForRange: (cells: RangeCell[]) => Participant[];
  getSlotIdsFromRange: (cells: RangeCell[]) => string[];
}

/**
 * Data layer for the results page: centralizes available/unavailable counts
 * and per-range participant derivation to keep the grid component small.
 */
export function useResultsAvailabilityMetrics({
  slotsByDate,
  dates,
  mergedTimeRows,
  votesBySlot,
  participants,
  selectedParticipants,
}: UseResultsAvailabilityMetricsProps): UseResultsAvailabilityMetricsResult {
  const selectedParticipantsList = useMemo(
    () =>
      participants.filter((participant) =>
        selectedParticipants.has(participant.userId),
      ),
    [participants, selectedParticipants],
  );

  const getSlotIdsFromRange = useCallback(
    (cells: RangeCell[]): string[] => {
      const slotIds: string[] = [];
      cells.forEach(({ dateKey, slotIndices }) => {
        slotIndices.forEach((slotIndex) => {
          const slot = slotsByDate[dateKey]?.[slotIndex];
          if (slot) {
            slotIds.push(slot.id);
          }
        });
      });
      return slotIds;
    },
    [slotsByDate],
  );

  const getAvailableVotesForSlotIds = useCallback(
    (slotIds: string[]): Vote[] => {
      if (slotIds.length === 0 || selectedParticipants.size === 0) {
        return [];
      }

      const availabilityCounter = new Map<
        string,
        { vote: Vote; count: number }
      >();

      slotIds.forEach((slotId) => {
        const votes = votesBySlot[slotId] || [];
        const seenInThisSlot = new Set<string>();

        votes.forEach((vote) => {
          if (
            !selectedParticipants.has(vote.userId) ||
            seenInThisSlot.has(vote.userId)
          ) {
            return;
          }

          seenInThisSlot.add(vote.userId);
          const existing = availabilityCounter.get(vote.userId);
          if (existing) {
            existing.count += 1;
          } else {
            availabilityCounter.set(vote.userId, { vote, count: 1 });
          }
        });
      });

      const requiredCount = slotIds.length;
      return Array.from(availabilityCounter.values())
        .filter(({ count }) => count === requiredCount)
        .map(({ vote }) => vote);
    },
    [selectedParticipants, votesBySlot],
  );

  const availableCountByCell = useMemo(() => {
    const map = new Map<string, number>();

    dates.forEach((dateKey) => {
      mergedTimeRows.forEach((row, rowIndex) => {
        const slotIds = row.slotIndices
          .map((slotIndex) => slotsByDate[dateKey]?.[slotIndex]?.id)
          .filter((slotId): slotId is string => Boolean(slotId));

        const availableCount = getAvailableVotesForSlotIds(slotIds).length;
        map.set(`${dateKey}::${rowIndex}`, availableCount);
      });
    });

    return map;
  }, [dates, mergedTimeRows, slotsByDate, getAvailableVotesForSlotIds]);

  const getCellCount = useCallback(
    (
      rowIndex: number,
      dateKey: string,
      mode: ResultsAvailabilityMode,
    ): number => {
      const availableCount =
        availableCountByCell.get(`${dateKey}::${rowIndex}`) || 0;
      if (mode === "available") {
        return availableCount;
      }
      return Math.max(0, selectedParticipants.size - availableCount);
    },
    [availableCountByCell, selectedParticipants.size],
  );

  const getAvailableVotesForRange = useCallback(
    (cells: RangeCell[]): Vote[] => {
      const slotIds = getSlotIdsFromRange(cells);
      return getAvailableVotesForSlotIds(slotIds);
    },
    [getSlotIdsFromRange, getAvailableVotesForSlotIds],
  );

  const getUnavailableParticipantsForRange = useCallback(
    (cells: RangeCell[]): Participant[] => {
      const availableVotes = getAvailableVotesForRange(cells);
      const availableUserIds = new Set(
        availableVotes.map((vote) => vote.userId),
      );
      return selectedParticipantsList.filter(
        (participant) => !availableUserIds.has(participant.userId),
      );
    },
    [getAvailableVotesForRange, selectedParticipantsList],
  );

  return {
    getCellCount,
    getAvailableVotesForRange,
    getUnavailableParticipantsForRange,
    getSlotIdsFromRange,
  };
}
