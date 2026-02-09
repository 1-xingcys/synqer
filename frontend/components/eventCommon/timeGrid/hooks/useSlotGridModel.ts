"use client";

import { useMemo } from "react";
import { TimeSlot } from "../types";
import { groupSlotsByDate } from "../utils";

interface UseSlotGridModelProps {
  slots: TimeSlot[];
}

interface UseSlotGridModelReturn {
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  timeSlots: TimeSlot[];
}

/**
 * 將原始 slots 正規化成可供 Grid 操作的結構：
 * 提供日期分組、排序後日期與基準 timeSlots。
 */
export function useSlotGridModel({
  slots,
}: UseSlotGridModelProps): UseSlotGridModelReturn {
  // Group slots by date
  const slotsByDate = useMemo(() => groupSlotsByDate(slots), [slots]);

  // Get sorted dates
  const dates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);

  // Get time slots from first date (all dates have same time slots)
  const timeSlots = useMemo(
    () => (dates.length > 0 ? slotsByDate[dates[0]] : []),
    [dates, slotsByDate],
  );

  return {
    slotsByDate,
    dates,
    timeSlots,
  };
}
