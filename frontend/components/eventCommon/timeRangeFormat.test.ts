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
});
