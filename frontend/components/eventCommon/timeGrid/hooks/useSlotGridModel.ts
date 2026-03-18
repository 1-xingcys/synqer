"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { GridAxisColumn, TimeSlot } from "../types";
import { buildAxisColumns, groupSlotsByAxis, sortAxisKeys } from "../utils";

interface UseSlotGridModelProps {
  slots: TimeSlot[];
}

interface UseSlotGridModelReturn {
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  columns: GridAxisColumn[];
  timeSlots: TimeSlot[];
}

/**
 * 將原始 slots 正規化成可供 Grid 操作的結構：
 * 提供日期分組、排序後日期與基準 timeSlots。
 */
export function useSlotGridModel({
  slots,
}: UseSlotGridModelProps): UseSlotGridModelReturn {
  const locale = useLocale();
  const slotsByDate = useMemo(() => groupSlotsByAxis(slots), [slots]);

  const dates = useMemo(
    () => sortAxisKeys(Object.keys(slotsByDate), slotsByDate, locale),
    [locale, slotsByDate],
  );
  const columns = useMemo(
    () => buildAxisColumns(dates, slotsByDate),
    [dates, slotsByDate],
  );

  // Get time slots from first date (all dates have same time slots)
  const timeSlots = useMemo(
    () => (dates.length > 0 ? slotsByDate[dates[0]] : []),
    [dates, slotsByDate],
  );

  return {
    slotsByDate,
    dates,
    columns,
    timeSlots,
  };
}
