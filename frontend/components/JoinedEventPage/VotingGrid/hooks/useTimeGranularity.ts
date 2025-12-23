"use client";

import { useMemo } from "react";
import { TimeSlot, TimeGranularity, MergedTimeRow } from "../types";

interface UseTimeGranularityProps {
  timeSlots: TimeSlot[];
  granularity: TimeGranularity;
}

interface UseTimeGranularityReturn {
  mergedRows: MergedTimeRow[];
  getSlotIndicesForRow: (rowIndex: number) => number[];
}

/**
 * Hook to calculate merged time rows based on granularity
 *
 * Example: If time range is 8:30~11:15 and granularity is 60min:
 * - 8:30~9:00 (30min remainder at start)
 * - 9:00~10:00 (60min)
 * - 10:00~11:00 (60min)
 * - 11:00~11:15 (15min remainder at end)
 */
export function useTimeGranularity({
  timeSlots,
  granularity,
}: UseTimeGranularityProps): UseTimeGranularityReturn {
  const mergedRows = useMemo(() => {
    if (timeSlots.length === 0) return [];
    if (granularity === 15) {
      // No merging needed - each slot is its own row
      return timeSlots.map((slot, index) => ({
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        slotIndices: [index],
        height: 1,
      }));
    }

    const result: MergedTimeRow[] = [];
    const startMinute = timeSlots[0].startMinute;
    const endMinute = timeSlots[timeSlots.length - 1].endMinute;

    // Find the first minute that aligns with granularity
    // e.g., for granularity=60, find first :00 minute
    // e.g., for granularity=30, find first :00 or :30 minute
    const findNextAlignedMinute = (minute: number): number => {
      const remainder = minute % granularity;
      if (remainder === 0) return minute;
      return minute + (granularity - remainder);
    };

    const firstAlignedMinute = findNextAlignedMinute(startMinute);

    let currentMinute = startMinute;
    let currentSlotIndex = 0;

    // Handle leading remainder (if start doesn't align with granularity)
    if (currentMinute < firstAlignedMinute && firstAlignedMinute <= endMinute) {
      const slotIndices: number[] = [];
      while (
        currentSlotIndex < timeSlots.length &&
        timeSlots[currentSlotIndex].startMinute < firstAlignedMinute
      ) {
        slotIndices.push(currentSlotIndex);
        currentSlotIndex++;
      }
      if (slotIndices.length > 0) {
        result.push({
          startMinute: currentMinute,
          endMinute: firstAlignedMinute,
          slotIndices,
          height: slotIndices.length,
        });
      }
      currentMinute = firstAlignedMinute;
    }

    // Handle main aligned chunks
    while (currentSlotIndex < timeSlots.length) {
      const chunkStartMinute = currentMinute;
      const chunkEndMinute = Math.min(currentMinute + granularity, endMinute);

      // Check if we have enough slots for a full granularity chunk
      const slotsNeeded = granularity / 15;
      const remainingSlots = timeSlots.length - currentSlotIndex;

      if (
        remainingSlots >= slotsNeeded &&
        chunkEndMinute - chunkStartMinute === granularity
      ) {
        // Full chunk
        const slotIndices: number[] = [];
        for (let i = 0; i < slotsNeeded; i++) {
          slotIndices.push(currentSlotIndex + i);
        }
        result.push({
          startMinute: chunkStartMinute,
          endMinute: chunkEndMinute,
          slotIndices,
          height: slotsNeeded,
        });
        currentSlotIndex += slotsNeeded;
        currentMinute = chunkEndMinute;
      } else {
        // Trailing remainder - collect all remaining slots
        const slotIndices: number[] = [];
        while (currentSlotIndex < timeSlots.length) {
          slotIndices.push(currentSlotIndex);
          currentSlotIndex++;
        }
        if (slotIndices.length > 0) {
          result.push({
            startMinute: chunkStartMinute,
            endMinute: timeSlots[slotIndices[slotIndices.length - 1]].endMinute,
            slotIndices,
            height: slotIndices.length,
          });
        }
        break;
      }
    }

    return result;
  }, [timeSlots, granularity]);

  const getSlotIndicesForRow = (rowIndex: number): number[] => {
    return mergedRows[rowIndex]?.slotIndices || [];
  };

  return {
    mergedRows,
    getSlotIndicesForRow,
  };
}
