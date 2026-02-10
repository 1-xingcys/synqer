"use client";

import { useMemo } from "react";
import { TimeGranularity, MergedTimeRow } from "../types";

interface TimeSlotForMerge {
  startMinute: number;
  endMinute: number;
}

interface UseMergedTimeRowsModelProps {
  timeSlots: TimeSlotForMerge[];
  granularity: TimeGranularity;
}

interface UseMergedTimeRowsModelReturn {
  mergedTimeRows: MergedTimeRow[];
  getSlotIndicesForRow: (rowIndex: number) => number[];
}

/**
 * 依時間粒度把 15 分鐘 slots 合併成可渲染列資料，
 * 並保留每列對應的原始 slot 索引，供選取與渲染共用。
 *
 * Hook to calculate merged time rows based on granularity
 *
 * This is the single source of truth for merging 15-min slots into
 * larger time blocks (30min or 60min).
 *
 * Algorithm:
 * 1. If granularity is 15, return each slot as its own row
 * 2. Find the first minute that aligns with the granularity
 * 3. Handle leading remainder (slots before first aligned minute)
 * 4. Create full-sized chunks for aligned portions
 * 5. Handle trailing remainder (remaining slots at the end)
 *
 * Example: If time range is 8:30~11:15 and granularity is 60min:
 * - 8:30~9:00 (30min remainder at start, height=2)
 * - 9:00~10:00 (60min, height=4)
 * - 10:00~11:00 (60min, height=4)
 * - 11:00~11:15 (15min remainder at end, height=1)
 */
export function useMergedTimeRowsModel({
  timeSlots,
  granularity,
}: UseMergedTimeRowsModelProps): UseMergedTimeRowsModelReturn {
  const mergedTimeRows = useMemo(() => {
    if (timeSlots.length === 0) return [];

    // No merging needed - each slot is its own row
    if (granularity === 15) {
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
    return mergedTimeRows[rowIndex]?.slotIndices || [];
  };

  return {
    mergedTimeRows,
    getSlotIndicesForRow,
  };
}
