import { describe, expect, it } from "@jest/globals";
import {
  axisSpanKey,
  axisSpanOfSlot,
  extendAxisSpan,
  type AxisSpan,
} from "@/lib/axisSpan";
import { calendarDay } from "@/lib/time";

const day = (value: string): AxisSpan => ({
  axisType: "DATE",
  startDay: calendarDay(value),
  endDay: calendarDay(value),
});

describe("axisSpanOfSlot", () => {
  it("reads a weekday slot as a weekday span", () => {
    expect(
      axisSpanOfSlot({ axisType: "WEEKDAY", axisWeekday: "MONDAY" }),
    ).toEqual({ axisType: "WEEKDAY", weekday: "MONDAY" });
  });

  // axisDate is a naive wall-clock value carrying its digits in the UTC
  // fields, so the day must be read out of those rather than local getters.
  it("reads a date slot as a single-day span in any runner zone", () => {
    expect(
      axisSpanOfSlot({
        axisType: "DATE",
        axisDate: "2026-07-30T00:00:00.000Z",
      }),
    ).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-30",
    });
  });

  it("returns null when the slot is missing its key", () => {
    expect(
      axisSpanOfSlot({ axisType: "WEEKDAY", axisWeekday: null }),
    ).toBeNull();
    expect(axisSpanOfSlot({ axisType: "DATE", axisDate: null })).toBeNull();
  });
});

describe("axisSpanKey", () => {
  it("keys a weekday span by its weekday", () => {
    expect(axisSpanKey({ axisType: "WEEKDAY", weekday: "MONDAY" })).toBe(
      "MONDAY",
    );
  });

  it("keys a date span by its start day", () => {
    expect(axisSpanKey(day("2026-07-30"))).toBe("2026-07-30");
  });
});

describe("extendAxisSpan", () => {
  it("extends a date span onto the next day", () => {
    expect(extendAxisSpan(day("2026-07-30"), day("2026-07-31"))).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-31",
    });
  });

  it("refuses a gap", () => {
    expect(extendAxisSpan(day("2026-07-30"), day("2026-08-01"))).toBeNull();
  });

  it("refuses to mix axis kinds", () => {
    expect(
      extendAxisSpan(day("2026-07-30"), {
        axisType: "WEEKDAY",
        weekday: "MONDAY",
      }),
    ).toBeNull();
  });

  // A weekday span covers exactly one weekday: there is no second end to move.
  it("extends a weekday span only onto itself", () => {
    const monday: AxisSpan = { axisType: "WEEKDAY", weekday: "MONDAY" };
    expect(extendAxisSpan(monday, monday)).toEqual(monday);
    expect(
      extendAxisSpan(monday, { axisType: "WEEKDAY", weekday: "TUESDAY" }),
    ).toBeNull();
  });
});
