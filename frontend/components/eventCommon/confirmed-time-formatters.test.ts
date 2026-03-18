import { describe, expect, it } from "@jest/globals";
import { formatConfirmedTimeRange } from "@/components/eventCommon/confirmed-time-formatters";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";

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

  it("formats recurring confirmed ranges with weekday and time", () => {
    const slotsById = new Map<string, TimeSlot>([
      [
        "slot-1",
        {
          id: "slot-1",
          date: "2000-01-03T00:00:00.000Z",
          axisType: "WEEKDAY",
          axisWeekday: "MONDAY",
          startMinute: 600,
          endMinute: 660,
          index: 0,
        },
      ],
      [
        "slot-2",
        {
          id: "slot-2",
          date: "2000-01-03T00:00:00.000Z",
          axisType: "WEEKDAY",
          axisWeekday: "MONDAY",
          startMinute: 660,
          endMinute: 720,
          index: 1,
        },
      ],
    ]);

    const result = formatConfirmedTimeRange(
      {
        startTime: "2025-04-21T10:00:00.000Z",
        endTime: "2025-04-21T12:00:00.000Z",
        slotIds: ["slot-2", "slot-1"],
      },
      "en-US",
      slotsById,
    );

    expect(result).toBe("Mon 10:00 - 12:00");
  });
});
