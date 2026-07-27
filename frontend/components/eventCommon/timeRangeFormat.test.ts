import { describe, expect, it } from "@jest/globals";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";

describe("timeRangeFormat", () => {
  it("renders a multi-day date range", () => {
    const result = formatLocalizedRangeLabel(
      {
        axisType: "DATE",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        startMinute: 1230,
        endMinute: 1410,
      },
      "zh-TW",
      { timeZone: "Asia/Taipei" },
    );

    expect(result).toBe("6/13（六） - 6/14（日） 20:30 - 23:30");
  });

  // Axis keys stopped carrying zoned instants when candidate days moved to the
  // naive encoding. Nothing produces this shape any more, and accepting it
  // meant re-projecting a value that has no zone of its own.
  it("rejects a zone-bearing axis key by name", () => {
    expect(() =>
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDate: "2026-06-13T00:00:00+08:00",
          endDate: "2026-06-14T00:00:00+08:00",
          startMinute: 1230,
          endMinute: 1410,
        },
        "zh-TW",
        { timeZone: "Asia/Taipei" },
      ),
    ).toThrow(/not a calendar day/i);
  });

  // A weekday range whose ends differ falls past the WEEKDAY branch into the
  // date formatter. That used to surface as "RangeError: Invalid time value"
  // from deep inside Intl, naming nothing.
  it("names a weekday key that reaches the date formatter", () => {
    expect(() =>
      formatLocalizedRangeLabel(
        {
          axisType: "WEEKDAY",
          startDate: "MONDAY",
          endDate: "TUESDAY",
          startMinute: 540,
          endMinute: 600,
        },
        "zh-TW",
      ),
    ).toThrow(/not a calendar day/i);
  });

  // Date-only axis keys are naive calendar days with no zone of their own, but
  // the label used to anchor them at midnight in the *browser's* zone and then
  // render them in the *event's* zone. Any event zone sitting west of the viewer
  // pushed the instant back past midnight onto the previous day, so a Taipei
  // host reading a New York event saw 7/29 for a 7/30 slot.
  it("keeps date-only axis keys on the stored calendar day for a westward event zone", () => {
    const label = (timeZone: string) =>
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDate: "2026-07-30",
          endDate: "2026-07-30",
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
});
