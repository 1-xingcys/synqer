import { describe, expect, it } from "@jest/globals";
import {
  addCalendarDays,
  axisDateToCalendarDay,
  calendarDayToWallClock,
  todayInZone,
  wallClockToCalendarDay,
} from "@/lib/calendarDay";
import { wallClockDay } from "@/lib/wallClock";

// Every assertion here must hold regardless of the runner's own zone: that is
// the whole point of moving pickers off local-midnight Date carriers. Run the
// suite under TZ=America/New_York and TZ=Pacific/Kiritimati to prove it.
describe("todayInZone", () => {
  // 2026-07-13T18:30Z is already the 14th in Taipei but still the 13th in
  // New York, so one instant pins both sides at once.
  const instant = new Date("2026-07-13T18:30:00Z");

  it("reports the calendar day of the requested zone", () => {
    expect(todayInZone("Asia/Taipei", instant)).toBe("2026-07-14");
    expect(todayInZone("America/New_York", instant)).toBe("2026-07-13");
    expect(todayInZone("UTC", instant)).toBe("2026-07-13");
  });

  it("pads single-digit months and days", () => {
    expect(todayInZone("UTC", new Date("2026-01-05T12:00:00Z"))).toBe(
      "2026-01-05",
    );
  });
});

describe("calendarDayToWallClock", () => {
  it("encodes the picked day and time into the UTC fields", () => {
    expect(calendarDayToWallClock("2026-07-13", "18:00")).toBe(
      "2026-07-13T18:00:00.000Z",
    );
  });

  it("round-trips through wallClockDay", () => {
    expect(wallClockDay(calendarDayToWallClock("2026-07-13", "18:00"))).toBe(
      "2026-07-13",
    );
  });

  it("keeps midnight on the picked day", () => {
    const wallClock = calendarDayToWallClock("2026-07-13", "00:00");
    expect(wallClock).toBe("2026-07-13T00:00:00.000Z");
    expect(wallClockDay(wallClock)).toBe("2026-07-13");
  });
});

describe("wallClockToCalendarDay", () => {
  it("reads the naive digits out of the UTC fields", () => {
    expect(wallClockToCalendarDay(new Date("2026-07-14T02:00:00Z"))).toBe(
      "2026-07-14",
    );
  });
});

describe("axisDateToCalendarDay", () => {
  // Slot axis dates are naive wall-clock values: the UTC fields carry the
  // digits. Reading them any other way drifts a day at the edges.
  it("reads the naive digits regardless of the runner's zone", () => {
    expect(axisDateToCalendarDay("2026-07-14T00:00:00.000Z")).toBe(
      "2026-07-14",
    );
    expect(axisDateToCalendarDay("2026-07-14T23:00:00.000Z")).toBe(
      "2026-07-14",
    );
  });

  it("accepts a date-only value unchanged", () => {
    expect(axisDateToCalendarDay("2026-07-14")).toBe("2026-07-14");
  });

  it("accepts a Date as well as a string", () => {
    expect(axisDateToCalendarDay(new Date("2026-07-14T00:00:00.000Z"))).toBe(
      "2026-07-14",
    );
  });

  it("returns null for missing values", () => {
    expect(axisDateToCalendarDay(null)).toBeNull();
    expect(axisDateToCalendarDay(undefined)).toBeNull();
    expect(axisDateToCalendarDay("")).toBeNull();
  });
});

describe("addCalendarDays", () => {
  it("advances by whole days", () => {
    expect(addCalendarDays("2026-07-13", 7)).toBe("2026-07-20");
  });

  it("rolls over month and year boundaries", () => {
    expect(addCalendarDays("2026-07-28", 7)).toBe("2026-08-04");
    expect(addCalendarDays("2026-12-30", 7)).toBe("2027-01-06");
  });

  it("handles leap days", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("supports negative offsets", () => {
    expect(addCalendarDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("calendar days compare as plain strings", () => {
  // The reason the whole encoding exists: ordering and equality need no helper.
  it("orders lexicographically", () => {
    expect("2026-07-13" < "2026-07-14").toBe(true);
    expect("2026-09-01" > "2026-08-31").toBe(true);
    expect(todayInZone("UTC", new Date("2026-07-13T00:00:00Z"))).toBe(
      "2026-07-13",
    );
  });
});
