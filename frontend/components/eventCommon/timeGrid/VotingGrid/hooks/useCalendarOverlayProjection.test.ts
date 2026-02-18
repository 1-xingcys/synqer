import { describe, expect, it } from "@jest/globals";
import { buildCalendarOverlayProjection } from "./useCalendarOverlayProjection";
import type { CalendarEvent, MergedTimeRow, TimeSlot } from "../../types";

function event(id: string): CalendarEvent {
  return {
    id,
    summary: id,
    startTime: "2026-01-01T09:00:00.000Z",
    endTime: "2026-01-01T10:00:00.000Z",
    isAllDay: false,
  };
}

describe("buildCalendarOverlayProjection", () => {
  it("deduplicates events and computes start-row spans", () => {
    const mergedTimeRows: MergedTimeRow[] = [
      { startMinute: 540, endMinute: 555, slotIndices: [0], height: 1 },
      { startMinute: 555, endMinute: 570, slotIndices: [1], height: 1 },
    ];

    const slotsByDate: Record<string, TimeSlot[]> = {
      "2026-01-01": [
        {
          id: "s1",
          date: "2026-01-01T00:00:00.000Z",
          startMinute: 540,
          endMinute: 555,
          index: 0,
        },
        {
          id: "s2",
          date: "2026-01-01T00:00:00.000Z",
          startMinute: 555,
          endMinute: 570,
          index: 1,
        },
      ],
    };

    const calendarEventsForSlot = new Map<string, CalendarEvent[]>([
      ["s1", [event("A"), event("B")]],
      ["s2", [event("A"), event("C")]],
    ]);

    const projection = buildCalendarOverlayProjection({
      mergedTimeRows,
      paginatedDates: ["2026-01-01"],
      slotsByDate,
      calendarEventsForSlot,
    });

    const row0 = projection.get("2026-01-01|0");
    const row1 = projection.get("2026-01-01|1");
    expect(row0).toBeDefined();
    expect(row1).toBeDefined();

    expect(row0?.events.map((e) => e.id).sort()).toEqual(["A", "B"]);
    expect(row0?.eventSpanById.get("A")).toBe(2);
    expect(row0?.eventSpanById.get("B")).toBe(1);
    expect(row0?.eventSpanById.get("C")).toBeUndefined();

    expect(row1?.events.map((e) => e.id).sort()).toEqual(["A", "C"]);
    expect(row1?.eventSpanById.get("A")).toBeUndefined();
    expect(row1?.eventSpanById.get("C")).toBe(1);
  });

  it("splits spans when rows are not contiguous", () => {
    const mergedTimeRows: MergedTimeRow[] = [
      { startMinute: 540, endMinute: 555, slotIndices: [0], height: 1 },
      { startMinute: 555, endMinute: 570, slotIndices: [1], height: 1 },
      { startMinute: 570, endMinute: 585, slotIndices: [2], height: 1 },
    ];

    const slotsByDate: Record<string, TimeSlot[]> = {
      "2026-01-02": [
        {
          id: "x1",
          date: "2026-01-02T00:00:00.000Z",
          startMinute: 540,
          endMinute: 555,
          index: 0,
        },
        {
          id: "x2",
          date: "2026-01-02T00:00:00.000Z",
          startMinute: 555,
          endMinute: 570,
          index: 1,
        },
        {
          id: "x3",
          date: "2026-01-02T00:00:00.000Z",
          startMinute: 570,
          endMinute: 585,
          index: 2,
        },
      ],
    };

    const calendarEventsForSlot = new Map<string, CalendarEvent[]>([
      ["x1", [event("D")]],
      ["x2", []],
      ["x3", [event("D")]],
    ]);

    const projection = buildCalendarOverlayProjection({
      mergedTimeRows,
      paginatedDates: ["2026-01-02"],
      slotsByDate,
      calendarEventsForSlot,
    });

    expect(projection.get("2026-01-02|0")?.eventSpanById.get("D")).toBe(1);
    expect(
      projection.get("2026-01-02|1")?.eventSpanById.get("D"),
    ).toBeUndefined();
    expect(projection.get("2026-01-02|2")?.eventSpanById.get("D")).toBe(1);
  });
});
