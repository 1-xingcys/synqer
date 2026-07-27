import { describe, expect, it } from "@jest/globals";
import {
  calendarDayMinuteToInstant,
  wallClockDay,
  wallClockTime,
  wallClockToDate,
  wallClockToInstant,
} from "@/lib/wallClock";

// A wall-clock value's digits must survive every runner zone untouched — that
// is the whole contract. Run under TZ=America/New_York and TZ=Asia/Taipei.
describe("wallClockDay / wallClockTime", () => {
  it("splits a wall-clock value into its day and time digits", () => {
    expect(wallClockDay("2026-07-14T02:00:00.000Z")).toBe("2026-07-14");
    expect(wallClockTime("2026-07-14T02:00:00.000Z")).toBe("02:00");
  });

  it("keeps late-evening values on their own day", () => {
    // 23:30 rolls to the next day for any eastward viewer zone if misread.
    expect(wallClockDay("2026-07-14T23:30:00.000Z")).toBe("2026-07-14");
    expect(wallClockTime("2026-07-14T23:30:00.000Z")).toBe("23:30");
  });

  it("renders midnight as 00:00 on the stored day", () => {
    expect(wallClockDay("2026-07-14T00:00:00.000Z")).toBe("2026-07-14");
    expect(wallClockTime("2026-07-14T00:00:00.000Z")).toBe("00:00");
  });
});

describe("wallClockToDate", () => {
  it("returns a Date whose UTC fields carry the digits", () => {
    const date = wallClockToDate("2026-07-14T18:00:00.000Z");

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
      calendarDayMinuteToInstant("2026-07-04", 0, "Asia/Taipei").toISOString(),
    ).toBe("2026-07-03T16:00:00.000Z");
    expect(
      calendarDayMinuteToInstant(
        "2026-07-04",
        570,
        "Asia/Taipei",
      ).toISOString(),
    ).toBe("2026-07-04T01:30:00.000Z");
  });

  it("rolls a 24:00 end boundary onto the next day", () => {
    expect(
      calendarDayMinuteToInstant("2026-07-04", 1440, "UTC").toISOString(),
    ).toBe("2026-07-05T00:00:00.000Z");
  });

  it("uses the event's zone rather than the runner's", () => {
    expect(
      calendarDayMinuteToInstant(
        "2026-07-04",
        540,
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-07-04T13:00:00.000Z");
  });
});

describe("wallClockToInstant", () => {
  it("resolves the digits against the event's zone", () => {
    // 18:00 in Taipei is 10:00Z; the same digits in New York are 22:00Z.
    expect(
      wallClockToInstant(
        "2026-07-14T18:00:00.000Z",
        "Asia/Taipei",
      ).toISOString(),
    ).toBe("2026-07-14T10:00:00.000Z");
    expect(
      wallClockToInstant(
        "2026-07-14T18:00:00.000Z",
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-07-14T22:00:00.000Z");
  });
});
