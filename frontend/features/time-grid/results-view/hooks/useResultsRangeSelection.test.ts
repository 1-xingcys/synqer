import { describe, expect, it } from "@jest/globals";
import { buildSelectionRange } from "./useResultsRangeSelection";
import { calendarDay } from "@/lib/time";

const columns = [
  {
    key: "2026-07-30",
    axis: {
      axisType: "DATE" as const,
      startDay: calendarDay("2026-07-30"),
      endDay: calendarDay("2026-07-30"),
    },
  },
  {
    key: "2026-07-31",
    axis: {
      axisType: "DATE" as const,
      startDay: calendarDay("2026-07-31"),
      endDay: calendarDay("2026-07-31"),
    },
  },
];

const rows = [
  { startMinute: 600, endMinute: 630, slotIndices: [0], height: 1 },
];

describe("buildSelectionRange", () => {
  it("spans the selected columns", () => {
    const range = buildSelectionRange(columns, rows, {
      minDate: 0,
      maxDate: 1,
      minRow: 0,
      maxRow: 0,
    });

    expect(range?.axis).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-31",
    });
  });

  it("returns null when the selection covers no cells", () => {
    expect(
      buildSelectionRange([], rows, {
        minDate: 0,
        maxDate: 0,
        minRow: 0,
        maxRow: 0,
      }),
    ).toBeNull();
  });
});
