"use client";
import { axisDateToCalendarDay } from "@/lib/time";
import { axisSpanOfSlot, extendAxisSpan, type AxisSpan } from "@/lib/axisSpan";

import { useMemo } from "react";
import { StagedConfirmation } from "@/types/event";
import { CANONICAL_WEEKDAY_ORDER } from "@/lib/event-time";
import type { EventSlot, SelectedTimeRange } from "../types";

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

function warnInvalidSlot(slotId: string, reason: string) {
  console.warn(`[eventTimeSelection] Skip invalid slot ${slotId}: ${reason}`);
}

function spanOfSlot(slot: EventSlot) {
  const span = axisSpanOfSlot(slot);
  if (!span) {
    warnInvalidSlot(
      slot.id,
      slot.axisType === "WEEKDAY" ? "missing axisWeekday" : "missing axisDate",
    );
  }

  return span;
}

function sortSlots(slots: EventSlot[]) {
  return [...slots].sort((left, right) => {
    if (
      left.axisType === "WEEKDAY" &&
      right.axisType === "WEEKDAY" &&
      left.axisWeekday &&
      right.axisWeekday
    ) {
      const weekdayDiff =
        CANONICAL_WEEKDAY_ORDER.indexOf(left.axisWeekday) -
        CANONICAL_WEEKDAY_ORDER.indexOf(right.axisWeekday);
      if (weekdayDiff !== 0) return weekdayDiff;

      return left.startMinute - right.startMinute;
    }

    if (!left.axisDate || !right.axisDate) {
      if (!left.axisDate) {
        warnInvalidSlot(left.id, "missing axisDate during sort");
      }
      if (!right.axisDate) {
        warnInvalidSlot(right.id, "missing axisDate during sort");
      }
      return left.startMinute - right.startMinute;
    }

    const leftDay = axisDateToCalendarDay(left.axisDate) ?? "";
    const rightDay = axisDateToCalendarDay(right.axisDate) ?? "";
    if (leftDay !== rightDay) return leftDay.localeCompare(rightDay);
    return left.startMinute - right.startMinute;
  });
}

interface BuildSelectedRangesOptions {
  idPrefix: string;
  isConfirmed: boolean;
  isStaged: boolean;
  isToBeRemoved?: boolean;
}

/**
 * Merge sorted slots into the ranges the panel lists.
 *
 * Exported so the merge rule can be tested without rendering: this repo has no
 * jsdom, and the rule — not the hook's memoisation — is the part worth pinning.
 */
export function buildSelectedRanges(
  slots: EventSlot[],
  options: BuildSelectedRangesOptions,
): SelectedTimeRange[] {
  const ranges: SelectedTimeRange[] = [];
  let currentRange: SelectedTimeRange | null = null;

  const startRange = (slot: EventSlot, span: AxisSpan): SelectedTimeRange => ({
    id: `${options.idPrefix}-${slot.id}`,
    axis: span,
    startTime: slot.startMinute,
    endTime: slot.endMinute,
    slotIds: [slot.id],
    isConfirmed: options.isConfirmed,
    isStaged: options.isStaged,
    isToBeRemoved: options.isToBeRemoved,
  });

  sortSlots(slots).forEach((slot) => {
    const span = spanOfSlot(slot);
    if (!span) return;

    if (!currentRange) {
      currentRange = startRange(slot, span);
      return;
    }

    const extended = extendAxisSpan(currentRange.axis, span);

    if (extended && currentRange.endTime === slot.startMinute) {
      currentRange.axis = extended;
      currentRange.endTime = slot.endMinute;
      currentRange.slotIds.push(slot.id);
      return;
    }

    ranges.push(currentRange);
    currentRange = startRange(slot, span);
  });

  if (currentRange) {
    ranges.push(currentRange);
  }

  return ranges;
}

function buildRangesFromSlotIds(
  slotIds: string[],
  slots: EventSlot[],
  options: BuildSelectedRangesOptions,
): SelectedTimeRange[] {
  if (slotIds.length === 0) return [];

  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));

  return buildSelectedRanges(
    slotIds
      .map((slotId) => slotsById.get(slotId))
      .filter((slot): slot is EventSlot => Boolean(slot)),
    options,
  );
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
