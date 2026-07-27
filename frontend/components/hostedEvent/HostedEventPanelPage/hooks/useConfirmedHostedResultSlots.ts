"use client";
import { axisDateToCalendarDay } from "@/lib/time";

import { useMemo } from "react";
import type { HostedResultSlot } from "@/lib/hostedEventResultSummary";
import { CANONICAL_WEEKDAY_ORDER } from "@/lib/event-time";
import type { EventSlot } from "../types";

interface UseConfirmedHostedResultSlotsOptions {
  slots: EventSlot[];
  confirmedSlotIds?: string[];
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
}: UseConfirmedHostedResultSlotsOptions): HostedResultSlot[] {
  return useMemo(() => {
    if (!confirmedSlotIds?.length) {
      return [];
    }

    const confirmedSlotIdSet = new Set(confirmedSlotIds);

    return slots
      .filter((slot) => confirmedSlotIdSet.has(slot.id))
      .map((slot) => ({
        id: slot.id,
        axisType: slot.axisType,
        axisDate: axisDateToCalendarDay(slot.axisDate),
        axisWeekday: slot.axisWeekday,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      }))
      .sort(sortHostedResultSlots);
  }, [confirmedSlotIds, slots]);
}
