import { describe, expect, it } from "@jest/globals";
import {
  addCalendarDays,
  axisDateToCalendarDay,
  calendarDay,
  parseCalendarDayValue,
  calendarDayToWallClock,
  todayInZone,
  wallClockToCalendarDay,
} from "@/lib/time";
import { wallClockDay } from "@/lib/time";

describe("calendarDay", () => {
  it("accepts a padded YYYY-MM-DD value unchanged", () => {
    expect(calendarDay("2026-07-13")).toBe("2026-07-13");
    expect(calendarDay("2026-01-05")).toBe("2026-01-05");
  });

  // The asymmetric misuse: a wall clock passed where a day belongs used to
  // reach addCalendarDays and come back "NaN-NaN-NaN".
  it("rejects a wall-clock value", () => {
    expect(() => calendarDay("2026-07-30T18:00:00.000Z")).toThrow(
      /not a calendar day/i,
    );
  });

  // Lexicographic ordering is the reason the encoding exists, and it only
  // holds at a fixed width.
  it("rejects unpadded components", () => {
    expect(() => calendarDay("2026-7-13")).toThrow(/not a calendar day/i);
    expect(() => calendarDay("2026-07-3")).toThrow(/not a calendar day/i);
  });

  it("rejects days that do not exist", () => {
    expect(() => calendarDay("2026-02-30")).toThrow(/not a calendar day/i);
    expect(() => calendarDay("2026-13-01")).toThrow(/not a calendar day/i);
    expect(() => calendarDay("2026-00-10")).toThrow(/not a calendar day/i);
  });

  it("accepts a real leap day", () => {
    expect(calendarDay("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects empty and malformed values", () => {
    expect(() => calendarDay("")).toThrow(/not a calendar day/i);
    expect(() => calendarDay("not a date")).toThrow(/not a calendar day/i);
  });

  it("names the offending value so a bad response is traceable", () => {
    expect(() => calendarDay("2026-02-30")).toThrow("2026-02-30");
  });
});

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
    expect(calendarDayToWallClock(calendarDay("2026-07-13"), "18:00")).toBe(
      "2026-07-13T18:00:00.000Z",
    );
  });

  it("round-trips through wallClockDay", () => {
    expect(
      wallClockDay(calendarDayToWallClock(calendarDay("2026-07-13"), "18:00")),
    ).toBe("2026-07-13");
  });

  it("keeps midnight on the picked day", () => {
    const wallClock = calendarDayToWallClock(
      calendarDay("2026-07-13"),
      "00:00",
    );
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

  // Without this the getters yield NaN and the template produces the string
  // "NaN-NaN-NaN", which then flows on as though it were a real day.
  it("rejects an invalid Date instead of producing NaN-NaN-NaN", () => {
    expect(() => wallClockToCalendarDay(new Date("garbage"))).toThrow(
      /invalid date/i,
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
    expect(addCalendarDays(calendarDay("2026-07-13"), 7)).toBe("2026-07-20");
  });

  it("rolls over month and year boundaries", () => {
    expect(addCalendarDays(calendarDay("2026-07-28"), 7)).toBe("2026-08-04");
    expect(addCalendarDays(calendarDay("2026-12-30"), 7)).toBe("2027-01-06");
  });

  it("handles leap days", () => {
    expect(addCalendarDays(calendarDay("2028-02-28"), 1)).toBe("2028-02-29");
  });

  it("supports negative offsets", () => {
    expect(addCalendarDays(calendarDay("2026-01-01"), -1)).toBe("2025-12-31");
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

describe("parseCalendarDayValue", () => {
  // Consumers read this back with *local* getters, so the noon anchor is what
  // keeps the digits intact in every runner zone. Run under
  // TZ=America/New_York and TZ=Pacific/Kiritimati to prove it.
  it("keeps the calendar day intact under local getters", () => {
    const date = parseCalendarDayValue("2026-07-30");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(30);
  });

  // Axis keys stopped carrying zoned instants when candidate days moved to the
  // naive encoding; nothing produces this shape any more.
  it("rejects a zone-bearing value by name", () => {
    expect(() => parseCalendarDayValue("2026-06-13T00:00:00+08:00")).toThrow(
      /not a calendar day/i,
    );
  });

  // A weekday key reaching here used to yield an invalid Date, and the callers
  // render it straight into labels as "NaN/NaN/NaN".
  it("rejects a weekday key by name", () => {
    expect(() => parseCalendarDayValue("MONDAY")).toThrow(
      /not a calendar day/i,
    );
  });
});
