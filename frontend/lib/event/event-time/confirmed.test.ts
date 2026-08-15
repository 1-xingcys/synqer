import { describe, expect, it } from "@jest/globals";
import { formatConfirmedSelection } from "@/lib/event/event-time";
import { wallClock } from "@/lib/time";

describe("confirmed-time-formatters", () => {
  it("formats one-time confirmed selections with date and time", () => {
    const result = formatConfirmedSelection(
      {
        kind: "ONE_TIME_RANGE",
        startTime: wallClock("2025-04-21T10:00:00.000Z"),
        endTime: wallClock("2025-04-21T11:00:00.000Z"),
        slotIds: ["slot-1"],
      },
      "en-US",
    );

    expect(result).toBe("4/21 (Mon) 10:00 - 11:00");
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

    expect(result).toBe("(Mon) 10:00 - 12:00");
  });
});
