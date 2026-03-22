"use client";

import { useMemo } from "react";
import type { HostedResultSlot } from "@/components/hostedEvent/resultSummary";
import { CANONICAL_WEEKDAY_ORDER } from "@/lib/weekdays";
import { type EventSlotAxisType, type Weekday } from "@/types/event";

interface EventSlot {
  id: string;
  axisType: EventSlotAxisType;
  axisDate?: string | Date | null;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
}

interface UseConfirmedHostedResultSlotsOptions {
  slots: EventSlot[];
  confirmedSlotIds?: string[];
  enabled?: boolean;
}

function normalizeAxisDate(axisDate?: string | Date | null): string | null {
  if (!axisDate) {
    return null;
  }

  return new Date(axisDate).toISOString().split("T")[0];
}

function sortHostedResultSlots(
  left: HostedResultSlot,
  right: HostedResultSlot,
): number {
  if (
    left.axisType === "WEEKDAY" &&
    right.axisType === "WEEKDAY" &&
    left.axisWeekday &&
    right.axisWeekday
  ) {
    const weekdayDiff =
      CANONICAL_WEEKDAY_ORDER.indexOf(left.axisWeekday) -
      CANONICAL_WEEKDAY_ORDER.indexOf(right.axisWeekday);

    if (weekdayDiff !== 0) {
      return weekdayDiff;
    }
  } else {
    const leftDateKey = left.axisDate ?? "";
    const rightDateKey = right.axisDate ?? "";
    const dateDiff = leftDateKey.localeCompare(rightDateKey);

    if (dateDiff !== 0) {
      return dateDiff;
    }
  }

  return left.startMinute - right.startMinute;
}

export function useConfirmedHostedResultSlots({
  slots,
  confirmedSlotIds,
  enabled = true,
}: UseConfirmedHostedResultSlotsOptions): HostedResultSlot[] {
  return useMemo(() => {
    if (!enabled || !confirmedSlotIds?.length) {
      return [];
    }

    const confirmedSlotIdSet = new Set(confirmedSlotIds);

    return slots
      .filter((slot) => confirmedSlotIdSet.has(slot.id))
      .map((slot) => ({
        id: slot.id,
        axisType: slot.axisType,
        axisDate: normalizeAxisDate(slot.axisDate),
        axisWeekday: slot.axisWeekday,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      }))
      .sort(sortHostedResultSlots);
  }, [confirmedSlotIds, enabled, slots]);
}
