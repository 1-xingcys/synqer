import { describe, expect, it } from "@jest/globals";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";
import { calendarDay } from "@/lib/time";

// The two cases that used to live here — a zone-bearing axis key, and a weekday
// key falling through into the date formatter — are gone because AxisSpan makes
// them unrepresentable: a date span's days are branded CalendarDay, and a
// weekday span has no second end to disagree with.
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
        { timeZone: "Asia/Taipei" },
      ),
    ).toBe("6/13（六） - 6/14（日） 20:30 - 23:30");
  });

  // Candidate days are naive: the label must read the stored digits rather
  // than re-projecting them through the viewer's or the event's zone.
  it("keeps a date span on its stored day in every event zone", () => {
    const label = (timeZone: string) =>
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-07-30"),
          endDay: calendarDay("2026-07-30"),
          startMinute: 600,
          endMinute: 660,
        },
        "en-US",
        { timeZone },
      );

    expect(label("America/New_York")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("Pacific/Honolulu")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("Asia/Taipei")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("UTC")).toBe("7/30 (Thu) 10:00 - 11:00");
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
