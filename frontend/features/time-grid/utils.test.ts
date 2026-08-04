import { describe, expect, it } from "@jest/globals";
import {
  buildAxisColumns,
  formatAxisHeader,
  formatAxisPageRange,
  groupSlotsByAxis,
  mapCalendarEventsToSlots,
  sortAxisKeys,
} from "@/features/time-grid/utils";
import {
  CalendarEvent,
  TimeSlot,
} from "@/features/time-grid/types";
import { calendarDay } from "@/lib/time";

const recurringSlots: TimeSlot[] = [
  {
    id: "slot-mon",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "MONDAY",
    startMinute: 540,
    endMinute: 570,
    index: 0,
  },
  {
    id: "slot-fri",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "FRIDAY",
    startMinute: 540,
    endMinute: 570,
    index: 1,
  },
  {
    id: "slot-wed",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "WEDNESDAY",
    startMinute: 540,
    endMinute: 570,
    index: 2,
  },
];

describe("timeGrid utils", () => {
  it("uses weekday as axis key for recurring slots", () => {
    expect(Object.keys(groupSlotsByAxis([recurringSlots[0]]))).toEqual([
      "MONDAY",
    ]);
  });

  it("sorts recurring axis keys in locale weekday order", () => {
    const slotsByAxis = groupSlotsByAxis(recurringSlots);

    expect(
      sortAxisKeys(["FRIDAY", "MONDAY", "WEDNESDAY"], slotsByAxis, "en-GB"),
    ).toEqual(["MONDAY", "WEDNESDAY", "FRIDAY"]);
  });

  it("builds weekday columns and formats weekday pagination/header", () => {
    const slotsByAxis = groupSlotsByAxis(recurringSlots);
    const columns = buildAxisColumns(["MONDAY", "WEDNESDAY"], slotsByAxis);

    expect(columns).toEqual([
      { key: "MONDAY", axis: { axisType: "WEEKDAY", weekday: "MONDAY" } },
      { key: "WEDNESDAY", axis: { axisType: "WEEKDAY", weekday: "WEDNESDAY" } },
    ]);
    expect(formatAxisHeader(columns[0], "en-US")).toEqual({ weekday: "Mon" });
    expect(formatAxisPageRange(columns[0], columns[1], "en-US")).toBe(
      "Mon ~ Wed",
    );
  });

  it("formats date columns as stable calendar days", () => {
    const dateColumn = {
      key: "2026-06-13",
      axis: {
        axisType: "DATE" as const,
        startDay: calendarDay("2026-06-13"),
        endDay: calendarDay("2026-06-13"),
      },
    };

    expect(formatAxisHeader(dateColumn, "en-US")).toEqual({
      weekday: "Sat",
      day: 13,
      month: "Jun",
    });
    expect(formatAxisPageRange(dateColumn, dateColumn, "en-US")).toBe(
      "2026/6/13",
    );
  });

  describe("mapCalendarEventsToSlots", () => {
    // Slot wall-clock 00:00-01:00 on 2026-07-04.
    const dateSlots: TimeSlot[] = [
      {
        id: "slot-1",
        axisType: "DATE",
        axisDate: "2026-07-04T00:00:00.000Z",
        axisWeekday: null,
        startMinute: 0,
        endMinute: 60,
        index: 0,
      },
    ];

    // Real instant that overlaps the slot ONLY when the slot is resolved in
    // Asia/Tokyo (UTC+9): 2026-07-04 00:00-01:00 Tokyo = 2026-07-03T15:00Z-16:00Z.
    // In the test runner's local zone or UTC the slot lands on a different
    // instant, so this event would NOT overlap under the old browser-local math.
    const tokyoOverlapEvent: CalendarEvent = {
      id: "cal-1",
      summary: "Busy",
      startTime: "2026-07-03T15:30:00.000Z",
      endTime: "2026-07-03T15:45:00.000Z",
      isAllDay: false,
    };

    it("resolves slot wall-clock via event.timeZone before overlap check", () => {
      const map = mapCalendarEventsToSlots(
        [tokyoOverlapEvent],
        dateSlots,
        "Asia/Tokyo",
      );

      expect(map.get("slot-1")).toEqual([tokyoOverlapEvent]);
    });

    it("does not map events that fall outside the slot in the event time zone", () => {
      // 2026-07-04 00:00-01:00 Tokyo = 15:00Z-16:00Z; this event is at 16:30Z.
      const outsideEvent: CalendarEvent = {
        id: "cal-2",
        summary: "Later",
        startTime: "2026-07-03T16:30:00.000Z",
        endTime: "2026-07-03T16:45:00.000Z",
        isAllDay: false,
      };

      const map = mapCalendarEventsToSlots(
        [outsideEvent],
        dateSlots,
        "Asia/Tokyo",
      );

      expect(map.has("slot-1")).toBe(false);
    });
  });
});
