"use client";

import { useMemo } from "react";
import { format } from "date-fns";

interface DatePaginationProps {
  dates: string[];
  currentPage: number;
  datesPerPage: number;
  onPageChange: (page: number) => void;
}

export function DatePagination({
  dates,
  currentPage,
  datesPerPage,
  onPageChange,
}: DatePaginationProps) {
  const totalPages = Math.ceil(dates.length / datesPerPage);
  
  const { startDate, endDate } = useMemo(() => {
    const startIdx = currentPage * datesPerPage;
    const endIdx = Math.min(startIdx + datesPerPage - 1, dates.length - 1);
    return {
      startDate: dates[startIdx],
      endDate: dates[endIdx],
    };
  }, [dates, currentPage, datesPerPage]);

  if (totalPages <= 1) return null;

  const formatPageDate = (dateStr: string) => {
    return format(new Date(dateStr), "M/d");
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formatPageDate(startDate)} - {formatPageDate(endDate)}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          ({currentPage + 1}/{totalPages})
        </span>
      </div>

      {/* Page dots */}
      <div className="hidden sm:flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onPageChange(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentPage
                ? "bg-blue-500 w-4"
                : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

