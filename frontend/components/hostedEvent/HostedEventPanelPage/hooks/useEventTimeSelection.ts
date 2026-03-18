"use client";

import { useMemo } from "react";
import { SelectedTimeRange } from "../EventTimeSelector";
import { EventSlotAxisType, StagedConfirmation, Weekday } from "@/types/event";

interface EventSlot {
  id: string;
  date: string | Date;
  axisType?: EventSlotAxisType;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
}

interface UseEventTimeSelectionOptions {
  slots: EventSlot[];
  confirmedSlotIds?: string[];
  stagedConfirmation?: StagedConfirmation | null;
}

interface UseEventTimeSelectionReturn {
  displayRanges: SelectedTimeRange[];
  committedSlotIdsSet: Set<string>;
  stagedSlotIdsSet: Set<string> | null;
  stagedBaselineSlotIdsSet: Set<string> | null;
  hasStagedChanges: boolean;
}

function sortSlots(slots: EventSlot[]) {
  const weekdayOrder: Weekday[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  return [...slots].sort((left, right) => {
    if (
      left.axisType === "WEEKDAY" &&
      right.axisType === "WEEKDAY" &&
      left.axisWeekday &&
      right.axisWeekday
    ) {
      const weekdayDiff =
        weekdayOrder.indexOf(left.axisWeekday) -
        weekdayOrder.indexOf(right.axisWeekday);
      if (weekdayDiff !== 0) return weekdayDiff;
    }

    const leftDate = new Date(left.date).getTime();
    const rightDate = new Date(right.date).getTime();
    if (leftDate !== rightDate) return leftDate - rightDate;
    return left.startMinute - right.startMinute;
  });
}

function buildRangesFromSlotIds(
  slotIds: string[],
  slots: EventSlot[],
  options: {
    idPrefix: string;
    isConfirmed: boolean;
    isStaged: boolean;
    isToBeRemoved?: boolean;
  },
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
    const axisType = slot.axisType === "WEEKDAY" ? "WEEKDAY" : "DATE";
    const dateKey =
      axisType === "WEEKDAY" && slot.axisWeekday
        ? slot.axisWeekday
        : new Date(slot.date).toISOString().split("T")[0];

    if (!currentRange) {
      currentRange = {
        id: `${options.idPrefix}-${slot.id}`,
        startDate: dateKey,
        endDate: dateKey,
        axisType,
        startTime: slot.startMinute,
        endTime: slot.endMinute,
        slotIds: [slot.id],
        isConfirmed: options.isConfirmed,
        isStaged: options.isStaged,
        isToBeRemoved: options.isToBeRemoved,
      };
      return;
    }

    const isSameDate =
      currentRange.axisType === axisType && currentRange.endDate === dateKey;
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
      axisType,
      startTime: slot.startMinute,
      endTime: slot.endMinute,
      slotIds: [slot.id],
      isConfirmed: options.isConfirmed,
      isStaged: options.isStaged,
      isToBeRemoved: options.isToBeRemoved,
    };
  });

  if (currentRange) {
    ranges.push(currentRange);
  }

  return ranges;
}

export function useEventTimeSelection({
  slots,
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

  const displayRanges = useMemo(() => {
    if (stagedConfirmation) {
      const stagedSlotIdSet = new Set(stagedConfirmation.slotIds);
      const baselineSlotIdSet = new Set(stagedConfirmation.baselineSlotIds);

      const committedRanges = buildRangesFromSlotIds(
        stagedConfirmation.baselineSlotIds.filter((slotId) =>
          stagedSlotIdSet.has(slotId),
        ),
        slots,
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
        {
          idPrefix: "staged",
          isConfirmed: false,
          isStaged: true,
        },
      );

      const removedRanges = buildRangesFromSlotIds(
        stagedConfirmation.baselineSlotIds.filter(
          (slotId) => !stagedSlotIdSet.has(slotId),
        ),
        slots,
        {
          idPrefix: "removed",
          isConfirmed: false,
          isStaged: false,
          isToBeRemoved: true,
        },
      );

      return [...committedRanges, ...stagedRanges, ...removedRanges];
    }

    return buildRangesFromSlotIds(confirmedSlotIds ?? [], slots, {
      idPrefix: "confirmed",
      isConfirmed: true,
      isStaged: false,
    });
  }, [confirmedSlotIds, slots, stagedConfirmation]);

  return {
    displayRanges,
    committedSlotIdsSet,
    stagedSlotIdsSet,
    stagedBaselineSlotIdsSet,
    hasStagedChanges: Boolean(stagedConfirmation),
  };
}
