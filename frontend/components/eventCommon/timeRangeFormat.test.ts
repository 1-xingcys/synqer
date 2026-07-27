import { describe, expect, it } from "@jest/globals";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";

describe("timeRangeFormat", () => {
  it("keeps weekday aligned with the displayed calendar date for timezone-bearing slots", () => {
    const result = formatLocalizedRangeLabel(
      {
        axisType: "DATE",
        startDate: "2026-06-13T00:00:00+08:00",
        endDate: "2026-06-14T00:00:00+08:00",
        startMinute: 1230,
        endMinute: 1410,
      },
      "zh-TW",
      { timeZone: "Asia/Taipei" },
    );

    expect(result).toBe("6/13（六） - 6/14（日） 20:30 - 23:30");
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
