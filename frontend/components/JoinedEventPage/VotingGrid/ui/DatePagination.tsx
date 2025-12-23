"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(dates.length / datesPerPage);

  // Get date range for current page
  const { startDate, endDate } = useMemo(() => {
    const startIdx = currentPage * datesPerPage;
    const endIdx = Math.min(startIdx + datesPerPage - 1, dates.length - 1);
    return {
      startDate: dates[startIdx],
      endDate: dates[endIdx],
    };
  }, [dates, currentPage, datesPerPage]);

  // Get all page ranges for dropdown
  const pageRanges = useMemo(() => {
    return Array.from({ length: totalPages }).map((_, pageIdx) => {
      const startIdx = pageIdx * datesPerPage;
      const endIdx = Math.min(startIdx + datesPerPage - 1, dates.length - 1);
      return {
        pageIdx,
        startDate: dates[startIdx],
        endDate: dates[endIdx],
      };
    });
  }, [dates, datesPerPage, totalPages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  if (totalPages <= 1) return null;

  // Format: YYYY/MM/DD
  const formatPageDate = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy/M/d");
  };

  const handlePageSelect = (pageIdx: number) => {
    onPageChange(pageIdx);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Page indicator with dropdown */}
      <div className="flex items-center gap-1.5" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs sm:text-sm ${
              isDropdownOpen
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <span className="font-medium">
              {formatPageDate(startDate)} ~ {formatPageDate(endDate)}
            </span>
            <svg
              className={`w-3 h-3 text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-0.5 max-h-[240px] overflow-y-auto">
              {pageRanges.map(
                ({ pageIdx, startDate: pStart, endDate: pEnd }) => (
                  <button
                    key={pageIdx}
                    onClick={() => handlePageSelect(pageIdx)}
                    className={`w-full px-3 py-1.5 text-xs sm:text-sm text-left transition-colors flex items-center justify-between gap-2 whitespace-nowrap ${
                      pageIdx === currentPage
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    <span>
                      {formatPageDate(pStart)} ~ {formatPageDate(pEnd)}
                    </span>
                    {pageIdx === currentPage && (
                      <svg
                        className="w-3.5 h-3.5 text-blue-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/* Page number - outside of button */}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {currentPage + 1}/{totalPages}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
