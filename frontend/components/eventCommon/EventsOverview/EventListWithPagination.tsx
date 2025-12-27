"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import EventRow from "./EventRow";
import { EventRowData, HostedEventRowData } from "./types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { paginateEvents } from "@/hooks/useFilteredAttendedEvents";
import EmptyState from "./EmptyState";
import { EventStatus } from "@/types/event";

interface EventListWithPaginationProps {
  events: (EventRowData | HostedEventRowData)[];
  category: EventStatus;
  pageSize?: number;
  mode?: "joined" | "hosted";
  translationNamespace?: string;
}

export default function EventListWithPagination({
  events,
  category,
  pageSize = 10,
  mode = "joined",
  translationNamespace = "joinedEvents",
}: EventListWithPaginationProps) {
  const t = useTranslations(translationNamespace);
  const [currentPage, setCurrentPage] = useState(1);

  const { items, totalPages, totalItems } = paginateEvents(
    events,
    currentPage,
    pageSize,
  );

  if (events.length === 0) {
    return (
      <EmptyState
        category={category}
        translationNamespace={translationNamespace}
      />
    );
  }

  // Generate pagination items
  const getPaginationItems = () => {
    const items: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      if (currentPage > 3) {
        items.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - 2) {
        items.push("ellipsis");
      }

      // Always show last page
      items.push(totalPages);
    }

    return items;
  };

  return (
    <div className="space-y-4">
      {/* Events Count */}
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {t("showingEvents", {
          start: (currentPage - 1) * pageSize + 1,
          end: Math.min(currentPage * pageSize, totalItems),
          total: totalItems,
        })}
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {items.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            variant={category}
            mode={mode}
            translationNamespace={translationNamespace}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {getPaginationItems().map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    onClick={() => setCurrentPage(item)}
                    isActive={currentPage === item}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
