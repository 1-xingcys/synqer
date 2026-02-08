"use client";

import { useMemo, useCallback } from "react";
import { CalendarEvent, MergedTimeRow, TimeSlot } from "../types";

interface CalendarOverlayProjectionParams {
  mergedRows: MergedTimeRow[];
  paginatedDates: string[];
  slotsByDate: Record<string, TimeSlot[]>;
  calendarEventsForSlot: Map<string, CalendarEvent[]>;
}

interface CalendarCellProjection {
  events: CalendarEvent[];
  eventSpanById: Map<string, number>;
}

interface UseCalendarOverlayProjectionResult {
  getCalendarProjectionForCell: (
    rowIndex: number,
    dateKey: string,
  ) => CalendarCellProjection;
}

const EMPTY_EVENTS: CalendarEvent[] = [];
const EMPTY_SPAN_MAP = new Map<string, number>();
const EMPTY_PROJECTION: CalendarCellProjection = {
  events: EMPTY_EVENTS,
  eventSpanById: EMPTY_SPAN_MAP,
};

function getCellKey(rowIndex: number, dateKey: string): string {
  return `${dateKey}|${rowIndex}`;
}

function computeProjectionForDate({
  dateKey,
  mergedRows,
  slotsByDate,
  calendarEventsForSlot,
}: {
  dateKey: string;
  mergedRows: MergedTimeRow[];
  slotsByDate: Record<string, TimeSlot[]>;
  calendarEventsForSlot: Map<string, CalendarEvent[]>;
}): Map<string, CalendarCellProjection> {
  const eventRowsById = new Map<string, number[]>();
  const rowEventsMap = new Map<number, CalendarEvent[]>();

  for (let rowIndex = 0; rowIndex < mergedRows.length; rowIndex++) {
    const row = mergedRows[rowIndex];
    const uniqueEventMap = new Map<string, CalendarEvent>();

    for (const slotIdx of row.slotIndices) {
      const slotId = slotsByDate[dateKey]?.[slotIdx]?.id;
      if (!slotId) continue;

      const events = calendarEventsForSlot.get(slotId) || EMPTY_EVENTS;
      for (const event of events) {
        if (!uniqueEventMap.has(event.id)) {
          uniqueEventMap.set(event.id, event);
        }
      }
    }

    const eventsInRow = Array.from(uniqueEventMap.values());
    rowEventsMap.set(rowIndex, eventsInRow);

    for (const event of eventsInRow) {
      const rows = eventRowsById.get(event.id);
      if (rows) {
        rows.push(rowIndex);
      } else {
        eventRowsById.set(event.id, [rowIndex]);
      }
    }
  }

  const startSpanMapByRow = new Map<number, Map<string, number>>();
  for (const [eventId, rows] of eventRowsById) {
    let runStartIndex = 0;

    for (let i = 1; i <= rows.length; i++) {
      const isRunEnded = i === rows.length || rows[i] !== rows[i - 1] + 1;
      if (!isRunEnded) continue;

      const startRow = rows[runStartIndex];
      const endRow = rows[i - 1];
      const span = endRow - startRow + 1;

      const rowSpanMap = startSpanMapByRow.get(startRow);
      if (rowSpanMap) {
        rowSpanMap.set(eventId, span);
      } else {
        startSpanMapByRow.set(startRow, new Map([[eventId, span]]));
      }

      runStartIndex = i;
    }
  }

  const result = new Map<string, CalendarCellProjection>();
  for (let rowIndex = 0; rowIndex < mergedRows.length; rowIndex++) {
    result.set(getCellKey(rowIndex, dateKey), {
      events: rowEventsMap.get(rowIndex) || EMPTY_EVENTS,
      eventSpanById: startSpanMapByRow.get(rowIndex) || EMPTY_SPAN_MAP,
    });
  }

  return result;
}

export function buildCalendarOverlayProjection(
  params: CalendarOverlayProjectionParams,
) {
  const { mergedRows, paginatedDates, slotsByDate, calendarEventsForSlot } =
    params;
  const result = new Map<string, CalendarCellProjection>();

  for (const dateKey of paginatedDates) {
    const dateProjection = computeProjectionForDate({
      dateKey,
      mergedRows,
      slotsByDate,
      calendarEventsForSlot,
    });

    for (const [cellKey, projection] of dateProjection) {
      result.set(cellKey, projection);
    }
  }

  return result;
}

export function useCalendarOverlayProjection({
  mergedRows,
  paginatedDates,
  slotsByDate,
  calendarEventsForSlot,
}: CalendarOverlayProjectionParams): UseCalendarOverlayProjectionResult {
  const projectionByCell = useMemo(
    () =>
      buildCalendarOverlayProjection({
        mergedRows,
        paginatedDates,
        slotsByDate,
        calendarEventsForSlot,
      }),
    [mergedRows, paginatedDates, slotsByDate, calendarEventsForSlot],
  );

  const getCalendarProjectionForCell = useCallback(
    (rowIndex: number, dateKey: string): CalendarCellProjection => {
      return (
        projectionByCell.get(getCellKey(rowIndex, dateKey)) || EMPTY_PROJECTION
      );
    },
    [projectionByCell],
  );

  return { getCalendarProjectionForCell };
}
