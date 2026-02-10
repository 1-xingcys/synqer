"use client";

import { useMemo, useState, useCallback } from "react";

interface UsePaginatedDatesProps {
  dates: string[];
  datesPerPage: number;
  initialPage?: number;
}

interface UsePaginatedDatesReturn {
  paginatedDates: string[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

/**
 * 將日期陣列切分為分頁資料，並在每頁容量變化時自動夾住頁碼範圍。
 *
 * Hook for paginating dates with automatic page clamping
 * when datesPerPage changes (e.g., on resize)
 */
export function usePaginatedDates({
  dates,
  datesPerPage,
  initialPage = 0,
}: UsePaginatedDatesProps): UsePaginatedDatesReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(dates.length / datesPerPage)),
    [dates.length, datesPerPage],
  );

  // Clamp currentPage to valid range (derived state, no effect needed)
  const clampedCurrentPage = Math.min(currentPage, totalPages - 1);

  const paginatedDates = useMemo(() => {
    const startIdx = clampedCurrentPage * datesPerPage;
    return dates.slice(startIdx, startIdx + datesPerPage);
  }, [dates, clampedCurrentPage, datesPerPage]);

  const canGoNext = clampedCurrentPage < totalPages - 1;
  const canGoPrev = clampedCurrentPage > 0;

  const goToNextPage = useCallback(() => {
    if (canGoNext) {
      setCurrentPage((p) => p + 1);
    }
  }, [canGoNext]);

  const goToPrevPage = useCallback(() => {
    if (canGoPrev) {
      setCurrentPage((p) => p - 1);
    }
  }, [canGoPrev]);

  return {
    paginatedDates,
    currentPage: clampedCurrentPage,
    totalPages,
    setCurrentPage,
    goToNextPage,
    goToPrevPage,
    canGoNext,
    canGoPrev,
  };
}
