import { describe, expect, it } from "@jest/globals";
import { buildSelectedRanges } from "./useEventTimeSelection";

const options = {
  idPrefix: "sel",
  isConfirmed: false,
  isStaged: false,
  isToBeRemoved: false,
};

describe("buildSelectedRanges", () => {
  it("merges contiguous slots on one day into a single date span", () => {
    const ranges = buildSelectedRanges(
      [
        {
          id: "a",
          axisType: "DATE",
          axisDate: "2026-07-30T00:00:00.000Z",
          startMinute: 600,
          endMinute: 630,
        },
        {
          id: "b",
          axisType: "DATE",
          axisDate: "2026-07-30T00:00:00.000Z",
          startMinute: 630,
          endMinute: 660,
        },
      ],
      options,
    );

    expect(ranges).toHaveLength(1);
    expect(ranges[0].axis).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-30",
    });
    expect(ranges[0].endTime).toBe(660);
  });

  it("keeps two weekdays as separate spans", () => {
    const ranges = buildSelectedRanges(
      [
        {
          id: "a",
          axisType: "WEEKDAY",
          axisWeekday: "MONDAY",
          startMinute: 600,
          endMinute: 630,
        },
        {
          id: "b",
          axisType: "WEEKDAY",
          axisWeekday: "TUESDAY",
          startMinute: 630,
          endMinute: 660,
        },
      ],
      options,
    );

    expect(ranges.map((range) => range.axis)).toEqual([
      { axisType: "WEEKDAY", weekday: "MONDAY" },
      { axisType: "WEEKDAY", weekday: "TUESDAY" },
    ]);
  });
});
