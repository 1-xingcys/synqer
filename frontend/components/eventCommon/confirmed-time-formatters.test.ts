import { describe, expect, it } from "@jest/globals";
import {
  formatConfirmedSelection,
  formatConfirmedTimeRange,
} from "@/components/eventCommon/confirmed-time-formatters";

describe("confirmed-time-formatters", () => {
  it("formats one-time confirmed ranges with date and time", () => {
    const result = formatConfirmedTimeRange(
      {
        startTime: "2025-04-21T10:00:00.000Z",
        endTime: "2025-04-21T11:00:00.000Z",
        slotIds: ["slot-1"],
      },
      "en-US",
      new Map(),
    );

    expect(result).toBe("Mon, Apr 21 10:00 - 11:00");
  });

  it("formats recurring confirmed selections with weekday and time", () => {
    const result = formatConfirmedSelection(
      {
        kind: "WEEKDAY_RANGE",
        weekday: "MONDAY",
        startMinute: 600,
        endMinute: 720,
        slotIds: ["slot-2", "slot-1"],
      },
      "en-US",
    );

    expect(result).toBe("Mon 10:00 - 12:00");
  });
});
