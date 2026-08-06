"use client";

import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useResponsiveGrid } from "../hooks";

interface GridSkeletonProps {
  /** Draws the date-pagination and tools row above the header. */
  showToolbar?: boolean;
  rows?: number;
}

/**
 * Placeholder for the time grid, shared by the vote and results tabs.
 *
 * Column count and row height come from useResponsiveGrid — the same source the
 * real grid uses — so the horizontal layout matches exactly. Row *count* can't
 * be known before the event's time range loads, so the body is drawn as a fixedu
 * number of full-width bands rather than a cell matrix: a wrong band count is
 * far less jarring than a wrong matrix.
 */
const DEFAULT_ROWS = 15;

// Matches TimeColumn / DateHeader's time gutter.
const TIME_GUTTER = "w-9 sm:w-14 shrink-0";

export function GridSkeleton({
  showToolbar = false,
  rows = DEFAULT_ROWS,
}: GridSkeletonProps) {
  const { datesPerPage, slotHeight } = useResponsiveGrid();
  const rowStyle = { height: slotHeight } as CSSProperties;

  return (
    <div className="space-y-2 sm:space-y-4">
      {showToolbar && (
        <div className="flex items-center gap-2 pt-4 sm:pt-6">
          <div className="flex-1 flex justify-between min-w-0">
            <Skeleton className="h-7 w-8 rounded-lg" />
            <Skeleton className="h-7 w-40 sm:w-56" />
            <Skeleton className="h-7 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-9.5" />
        </div>
      )}

      {/* Date header: weekday / day / month, one stack per column */}
      <div className="flex">
        <div className={TIME_GUTTER} />
        {Array.from({ length: datesPerPage }).map((_, index) => (
          <div
            key={index}
            className="flex-1 min-w-0 p-1 sm:p-2 mx-px sm:mx-0.5 flex flex-col items-center gap-1"
          >
            <Skeleton className="h-2.5 w-6" />
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-2.5 w-7" />
          </div>
        ))}
      </div>

      <div className="flex">
        <div
          className={`${TIME_GUTTER} border-r border-gray-200 dark:border-zinc-700`}
        >
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="relative" style={rowStyle}>
              <Skeleton className="absolute -top-2 right-1 h-2.5 w-6 sm:w-8" />
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="py-px" style={rowStyle}>
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
