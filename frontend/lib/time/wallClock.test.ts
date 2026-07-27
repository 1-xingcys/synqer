import { describe, expect, it } from "@jest/globals";
import {
  calendarDayMinuteToInstant,
  formatWallClock,
  wallClock,
  wallClockDay,
  wallClockTime,
  wallClockToDate,
  wallClockToInstant,
} from "@/lib/time";
import { calendarDay, calendarDayToWallClock } from "@/lib/time";

describe("wallClock", () => {
  it("accepts the wire form unchanged", () => {
    expect(wallClock("2026-07-30T18:00:00.000Z")).toBe(
      "2026-07-30T18:00:00.000Z",
    );
  });

  it("accepts a date-time without milliseconds", () => {
    expect(wallClock("2026-07-30T18:00:00Z")).toBe("2026-07-30T18:00:00Z");
  });

  // The quiet one: a calendar day read as a wall clock reports "00:00", which
  // is a plausible-looking time rather than an obvious failure.
  it("rejects a calendar day", () => {
    expect(() => wallClock("2026-07-30")).toThrow(/not a wall clock/i);
  });

  // A value carrying a real offset is an instant, not a naive wall clock;
  // treating its digits as naive shifts it by that offset.
  it("rejects a zone offset", () => {
    expect(() => wallClock("2026-07-30T18:00:00+08:00")).toThrow(
      /not a wall clock/i,
    );
  });

  it("rejects times that do not exist", () => {
    expect(() => wallClock("2026-07-30T25:00:00.000Z")).toThrow(
      /not a wall clock/i,
    );
    expect(() => wallClock("2026-02-30T18:00:00.000Z")).toThrow(
      /not a wall clock/i,
    );
  });

  it("rejects empty and malformed values", () => {
    expect(() => wallClock("")).toThrow(/not a wall clock/i);
    expect(() => wallClock("not a date")).toThrow(/not a wall clock/i);
  });

  it("names the offending value so a bad response is traceable", () => {
    expect(() => wallClock("2026-07-30")).toThrow("2026-07-30");
  });
});

// A wall-clock value's digits must survive every runner zone untouched — that
// is the whole contract. Run under TZ=America/New_York and TZ=Asia/Taipei.
describe("wallClockDay / wallClockTime", () => {
  it("splits a wall-clock value into its day and time digits", () => {
    expect(wallClockDay(wallClock("2026-07-14T02:00:00.000Z"))).toBe(
      "2026-07-14",
    );
    expect(wallClockTime(wallClock("2026-07-14T02:00:00.000Z"))).toBe("02:00");
  });

  it("keeps late-evening values on their own day", () => {
    // 23:30 rolls to the next day for any eastward viewer zone if misread.
    expect(wallClockDay(wallClock("2026-07-14T23:30:00.000Z"))).toBe(
      "2026-07-14",
    );
    expect(wallClockTime(wallClock("2026-07-14T23:30:00.000Z"))).toBe("23:30");
  });

  it("renders midnight as 00:00 on the stored day", () => {
    expect(wallClockDay(wallClock("2026-07-14T00:00:00.000Z"))).toBe(
      "2026-07-14",
    );
    expect(wallClockTime(wallClock("2026-07-14T00:00:00.000Z"))).toBe("00:00");
  });
});

describe("wallClockToDate", () => {
  it("returns a Date whose UTC fields carry the digits", () => {
    const date = wallClockToDate(wallClock("2026-07-14T18:00:00.000Z"));

    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(6);
    expect(date.getUTCDate()).toBe(14);
    expect(date.getUTCHours()).toBe(18);
  });
});

describe("calendarDayMinuteToInstant", () => {
  it("resolves a slot's day and minute-of-day against the event's zone", () => {
    // 00:00 wall-clock on 2026-07-04 is 2026-07-03T16:00Z in Taipei.
    expect(
      calendarDayMinuteToInstant(
        calendarDay("2026-07-04"),
        0,
        "Asia/Taipei",
      ).toISOString(),
    ).toBe("2026-07-03T16:00:00.000Z");
    expect(
      calendarDayMinuteToInstant(
        calendarDay("2026-07-04"),
        570,
        "Asia/Taipei",
      ).toISOString(),
    ).toBe("2026-07-04T01:30:00.000Z");
  });

  it("rolls a 24:00 end boundary onto the next day", () => {
    expect(
      calendarDayMinuteToInstant(
        calendarDay("2026-07-04"),
        1440,
        "UTC",
      ).toISOString(),
    ).toBe("2026-07-05T00:00:00.000Z");
  });

  it("uses the event's zone rather than the runner's", () => {
    expect(
      calendarDayMinuteToInstant(
        calendarDay("2026-07-04"),
        540,
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-07-04T13:00:00.000Z");
  });
});

describe("formatWallClock", () => {
  it("shows the digits it carries, not a zone-shifted instant", () => {
    // 18:00 is late enough that any eastward viewer zone would roll the day.
    expect(formatWallClock(wallClock("2026-07-30T18:00:00.000Z"))).toBe(
      "2026/07/30 18:00",
    );
    // 02:00 is early enough that any westward viewer zone would roll it back.
    expect(formatWallClock(wallClock("2026-07-30T02:00:00.000Z"))).toBe(
      "2026/07/30 02:00",
    );
  });

  it("round-trips a value produced by calendarDayToWallClock", () => {
    const picked = calendarDayToWallClock(calendarDay("2026-07-13"), "18:00");
    expect(formatWallClock(picked)).toBe("2026/07/13 18:00");
  });
});

describe("wallClockToInstant", () => {
  it("resolves the digits against the event's zone", () => {
    // 18:00 in Taipei is 10:00Z; the same digits in New York are 22:00Z.
    expect(
      wallClockToInstant(
        wallClock("2026-07-14T18:00:00.000Z"),
        "Asia/Taipei",
      ).toISOString(),
    ).toBe("2026-07-14T10:00:00.000Z");
    expect(
      wallClockToInstant(
        wallClock("2026-07-14T18:00:00.000Z"),
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-07-14T22:00:00.000Z");
  });
});
