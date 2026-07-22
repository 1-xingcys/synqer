import { describe, expect, it } from "@jest/globals";
import { getTodayInTimeZone } from "./utils";

function toYmd(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

describe("getTodayInTimeZone", () => {
  it("uses the given time zone's calendar day, not the runner's", () => {
    // 2026-07-16T02:00Z is still 2026-07-15 22:00 in America/New_York.
    const today = getTodayInTimeZone(
      "America/New_York",
      new Date("2026-07-16T02:00:00.000Z"),
    );

    expect(toYmd(today)).toEqual([2026, 7, 15]);
  });
});
