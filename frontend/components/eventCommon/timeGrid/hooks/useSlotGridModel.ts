"use client";

import { useMemo, useCallback } from "react";
import { GridPosition, TimeSlot } from "../types";
import { groupSlotsByDate, createSlotGrid } from "../utils";

interface UseSlotGridModelProps {
  slots: TimeSlot[];
}

interface UseSlotGridModelReturn {
  slotsByDate: Record<string, TimeSlot[]>;
  dates: string[];
  timeSlots: TimeSlot[];
  slotGrid: string[][];
  getSlotPosition: (slotId: string) => GridPosition | null;
  getSlotsInRectangle: (start: GridPosition, end: GridPosition) => Set<string>;
}

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

  // Create 2D grid for position lookups
  const slotGrid = useMemo(
    () => createSlotGrid(dates, timeSlots, slotsByDate),
    [dates, timeSlots, slotsByDate],
  );

  // Get slot position from slotId
  const getSlotPosition = useCallback(
    (slotId: string): GridPosition | null => {
      for (let timeIndex = 0; timeIndex < slotGrid.length; timeIndex++) {
        for (
          let dateIndex = 0;
          dateIndex < slotGrid[timeIndex].length;
          dateIndex++
        ) {
          if (slotGrid[timeIndex][dateIndex] === slotId) {
            return { dateIndex, timeIndex };
          }
        }
      }
      return null;
    },
    [slotGrid],
  );

  // Get slots within rectangle
  const getSlotsInRectangle = useCallback(
    (start: GridPosition, end: GridPosition): Set<string> => {
      const minDate = Math.min(start.dateIndex, end.dateIndex);
      const maxDate = Math.max(start.dateIndex, end.dateIndex);
      const minTime = Math.min(start.timeIndex, end.timeIndex);
      const maxTime = Math.max(start.timeIndex, end.timeIndex);

      const result = new Set<string>();
      for (let t = minTime; t <= maxTime; t++) {
        for (let d = minDate; d <= maxDate; d++) {
          const slotId = slotGrid[t]?.[d];
          if (slotId) {
            result.add(slotId);
          }
        }
      }
      return result;
    },
    [slotGrid],
  );

  return {
    slotsByDate,
    dates,
    timeSlots,
    slotGrid,
    getSlotPosition,
    getSlotsInRectangle,
  };
}
