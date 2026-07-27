import { describe, expect, it } from "@jest/globals";
import { formatLocalizedRangeLabel } from "@/lib/event-time";
import { calendarDay } from "@/lib/time";

// The cases that used to live here are gone because the types and the API make
// them unrepresentable: AxisSpan brands a date span's days as CalendarDay and
// gives a weekday span no second end, and the formatter no longer accepts a
// time zone to project a naive day into.
describe("timeRangeFormat", () => {
  it("renders a multi-day date range", () => {
    expect(
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-06-13"),
          endDay: calendarDay("2026-06-14"),
          startMinute: 1230,
          endMinute: 1410,
        },
        "zh-TW",
      ),
    ).toBe("6/13（六） - 6/14（日） 20:30 - 23:30");
  });

  // Candidate days are naive: the label reads the stored digits. Jest runs in
  // the machine's zone rather than UTC, so this fails if the formatters ever
  // stop being pinned.
  it("keeps a date span on its stored day", () => {
    expect(
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-07-30"),
          endDay: calendarDay("2026-07-30"),
          startMinute: 600,
          endMinute: 660,
        },
        "en-US",
      ),
    ).toBe("7/30 (Thu) 10:00 - 11:00");
  });

  it("renders a weekday span", () => {
    expect(
      formatLocalizedRangeLabel(
        {
          axisType: "WEEKDAY",
          weekday: "MONDAY",
          startMinute: 600,
          endMinute: 720,
        },
        "en-US",
      ),
    ).toBe("(Mon) 10:00 - 12:00");
  });
});
