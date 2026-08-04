"use client";

import { useCallback, useMemo } from "react";
import { MergedTimeRow, TimeSlot, Vote } from "../../types";

/**
 * The part of a merged cell that only moves when server data moves.
 *
 * Kept apart from the selection/drag fields on purpose: these arrays are handed
 * to `TimeSlotCell` as-is, so they must keep their identity across a hover or a
 * drag step or `memo` cannot skip anything.
 */
export interface SlotCellData {
  /** Slot ids covered by this merged cell, in row order. */
  slotIds: string[];
  /** Pre-joined form, so the cell receives a primitive for its data attribute. */
  mergedSlotIdsAttr: string;
  /** Distinct display names of everyone who voted for any slot in the cell. */
  voters: string[];
}

interface SlotCellDataProjectionParams {
  mergedTimeRows: MergedTimeRow[];
  paginatedDates: string[];
  slotsByDate: Record<string, TimeSlot[]>;
  votesBySlot: Record<string, Vote[]>;
}

interface UseSlotCellDataProjectionResult {
  getCellData: (rowIndex: number, dateKey: string) => SlotCellData;
}

const EMPTY_SLOT_IDS: string[] = [];
const EMPTY_VOTERS: string[] = [];
const EMPTY_VOTES: Vote[] = [];
const EMPTY_CELL_DATA: SlotCellData = {
  slotIds: EMPTY_SLOT_IDS,
  mergedSlotIdsAttr: "",
  voters: EMPTY_VOTERS,
};

function getCellKey(rowIndex: number, dateKey: string): string {
  return `${dateKey}|${rowIndex}`;
}

export function buildSlotCellDataProjection({
  mergedTimeRows,
  paginatedDates,
  slotsByDate,
  votesBySlot,
}: SlotCellDataProjectionParams): Map<string, SlotCellData> {
  const result = new Map<string, SlotCellData>();

  for (const dateKey of paginatedDates) {
    const slotsForDate = slotsByDate[dateKey];

    for (let rowIndex = 0; rowIndex < mergedTimeRows.length; rowIndex++) {
      const slotIds: string[] = [];
      const voters: string[] = [];
      const seenVoters = new Set<string>();

      for (const slotIndex of mergedTimeRows[rowIndex].slotIndices) {
        const slot = slotsForDate?.[slotIndex];
        if (!slot) continue;

        slotIds.push(slot.id);

        for (const vote of votesBySlot[slot.id] ?? EMPTY_VOTES) {
          if (seenVoters.has(vote.userDisplayName)) continue;
          seenVoters.add(vote.userDisplayName);
          voters.push(vote.userDisplayName);
        }
      }

      result.set(getCellKey(rowIndex, dateKey), {
        slotIds: slotIds.length > 0 ? slotIds : EMPTY_SLOT_IDS,
        mergedSlotIdsAttr: slotIds.join(","),
        voters: voters.length > 0 ? voters : EMPTY_VOTERS,
      });
    }
  }

  return result;
}

/**
 * Precomputes each merged cell's slot ids and voter list once per data change,
 * mirroring how useCalendarOverlayProjection projects calendar events.
 */
export function useSlotCellDataProjection({
  mergedTimeRows,
  paginatedDates,
  slotsByDate,
  votesBySlot,
}: SlotCellDataProjectionParams): UseSlotCellDataProjectionResult {
  const projectionByCell = useMemo(
    () =>
      buildSlotCellDataProjection({
        mergedTimeRows,
        paginatedDates,
        slotsByDate,
        votesBySlot,
      }),
    [mergedTimeRows, paginatedDates, slotsByDate, votesBySlot],
  );

  const getCellData = useCallback(
    (rowIndex: number, dateKey: string): SlotCellData =>
      projectionByCell.get(getCellKey(rowIndex, dateKey)) ?? EMPTY_CELL_DATA,
    [projectionByCell],
  );

  return { getCellData };
}
