"use client";

import {
  useMergedRows,
  type TimeGranularity,
  type MergedTimeRow,
} from "@/components/eventCommon/hooks";
import { TimeSlot } from "../types";

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
 * This is a wrapper around the shared useMergedRows hook
 * to maintain backwards compatibility with VotingGrid
 */
export function useTimeGranularity({
  timeSlots,
  granularity,
}: UseTimeGranularityProps): UseTimeGranularityReturn {
  return useMergedRows({ timeSlots, granularity });
}
