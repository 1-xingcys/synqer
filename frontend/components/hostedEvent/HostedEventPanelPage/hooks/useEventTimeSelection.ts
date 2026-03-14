"use client";

import { useMemo } from "react";
import { SelectedTimeRange } from "../EventTimeSelector";
import { StagedConfirmation } from "@/types/event";

interface EventSlot {
  id: string;
  date: string | Date;
  startMinute: number;
  endMinute: number;
}

interface UseEventTimeSelectionOptions {
  slots: EventSlot[];
  totalParticipants: number;
  confirmedSlotIds?: string[];
  stagedConfirmation?: StagedConfirmation | null;
}

interface UseEventTimeSelectionReturn {
  displayRanges: SelectedTimeRange[];
  committedSlotIdsSet: Set<string>;
  stagedSlotIdsSet: Set<string> | null;
  stagedBaselineSlotIdsSet: Set<string> | null;
  effectiveSlotIdsSet: Set<string>;
  hasStagedChanges: boolean;
}

function sortSlots(slots: EventSlot[]) {
  return [...slots].sort((left, right) => {
    const leftDate = new Date(left.date).getTime();
    const rightDate = new Date(right.date).getTime();
    if (leftDate !== rightDate) return leftDate - rightDate;
    return left.startMinute - right.startMinute;
  });
}

function buildRangesFromSlotIds(
  slotIds: string[],
  slots: EventSlot[],
  totalParticipants: number,
  options: { idPrefix: string; isConfirmed: boolean; isStaged: boolean },
): SelectedTimeRange[] {
  if (slotIds.length === 0) return [];

  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const sortedSlots = sortSlots(
    slotIds
      .map((slotId) => slotsById.get(slotId))
      .filter((slot): slot is EventSlot => Boolean(slot)),
  );

  if (sortedSlots.length === 0) return [];

  const ranges: SelectedTimeRange[] = [];
  let currentRange: SelectedTimeRange | null = null;

  sortedSlots.forEach((slot) => {
    const slotDate = new Date(slot.date);
    const dateKey = slotDate.toISOString().split("T")[0];

    if (!currentRange) {
      currentRange = {
        id: `${options.idPrefix}-${slot.id}`,
        startDate: dateKey,
        endDate: dateKey,
        startTime: slot.startMinute,
        endTime: slot.endMinute,
        slotIds: [slot.id],
        availableCount: 0,
        totalParticipants,
        isConfirmed: options.isConfirmed,
        isStaged: options.isStaged,
      };
      return;
    }

    const isSameDate = currentRange.endDate === dateKey;
    const isContiguous =
      isSameDate && currentRange.endTime === slot.startMinute;

    if (isContiguous) {
      currentRange.endTime = slot.endMinute;
      currentRange.slotIds.push(slot.id);
      return;
    }

    ranges.push(currentRange);
    currentRange = {
      id: `${options.idPrefix}-${slot.id}`,
      startDate: dateKey,
      endDate: dateKey,
      startTime: slot.startMinute,
      endTime: slot.endMinute,
      slotIds: [slot.id],
      availableCount: 0,
      totalParticipants,
      isConfirmed: options.isConfirmed,
      isStaged: options.isStaged,
    };
  });

  if (currentRange) {
    ranges.push(currentRange);
  }

  return ranges;
}

export function useEventTimeSelection({
  slots,
  totalParticipants,
  confirmedSlotIds,
  stagedConfirmation,
}: UseEventTimeSelectionOptions): UseEventTimeSelectionReturn {
  const committedSlotIdsSet = useMemo(
    () => new Set(confirmedSlotIds ?? []),
    [confirmedSlotIds],
  );

  const stagedSlotIdsSet = useMemo(
    () => (stagedConfirmation ? new Set(stagedConfirmation.slotIds) : null),
    [stagedConfirmation],
  );

  const stagedBaselineSlotIdsSet = useMemo(
    () =>
      stagedConfirmation ? new Set(stagedConfirmation.baselineSlotIds) : null,
    [stagedConfirmation],
  );

  const effectiveSlotIdsSet = useMemo(
    () => stagedSlotIdsSet ?? committedSlotIdsSet,
    [stagedSlotIdsSet, committedSlotIdsSet],
  );

  const displayRanges = useMemo(() => {
    if (stagedConfirmation) {
      const stagedSlotIdSet = new Set(stagedConfirmation.slotIds);
      const baselineSlotIdSet = new Set(stagedConfirmation.baselineSlotIds);

      const committedRanges = buildRangesFromSlotIds(
        stagedConfirmation.baselineSlotIds.filter((slotId) =>
          stagedSlotIdSet.has(slotId),
        ),
        slots,
        totalParticipants,
        {
          idPrefix: "confirmed",
          isConfirmed: true,
          isStaged: false,
        },
      );

      const stagedRanges = buildRangesFromSlotIds(
        stagedConfirmation.slotIds.filter(
          (slotId) => !baselineSlotIdSet.has(slotId),
        ),
        slots,
        totalParticipants,
        {
          idPrefix: "staged",
          isConfirmed: false,
          isStaged: true,
        },
      );

      return [...committedRanges, ...stagedRanges];
    }

    return buildRangesFromSlotIds(
      confirmedSlotIds ?? [],
      slots,
      totalParticipants,
      {
        idPrefix: "confirmed",
        isConfirmed: true,
        isStaged: false,
      },
    );
  }, [confirmedSlotIds, slots, stagedConfirmation, totalParticipants]);

  return {
    displayRanges,
    committedSlotIdsSet,
    stagedSlotIdsSet,
    stagedBaselineSlotIdsSet,
    effectiveSlotIdsSet,
    hasStagedChanges: Boolean(stagedConfirmation),
  };
}
