import { describe, expect, it } from "@jest/globals";
import {
  buildAxisColumns,
  formatAxisHeader,
  formatAxisPageRange,
  getSlotAxisKey,
  groupSlotsByAxis,
  sortAxisKeys,
} from "@/components/eventCommon/timeGrid/utils";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";

const recurringSlots: TimeSlot[] = [
  {
    id: "slot-mon",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "MONDAY",
    startMinute: 540,
    endMinute: 570,
    index: 0,
  },
  {
    id: "slot-fri",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "FRIDAY",
    startMinute: 540,
    endMinute: 570,
    index: 1,
  },
  {
    id: "slot-wed",
    axisType: "WEEKDAY",
    axisDate: null,
    axisWeekday: "WEDNESDAY",
    startMinute: 540,
    endMinute: 570,
    index: 2,
  },
];

describe("timeGrid utils", () => {
  it("uses weekday as axis key for recurring slots", () => {
    expect(getSlotAxisKey(recurringSlots[0])).toBe("MONDAY");
  });

  it("sorts recurring axis keys in locale weekday order", () => {
    const slotsByAxis = groupSlotsByAxis(recurringSlots);

    expect(
      sortAxisKeys(["FRIDAY", "MONDAY", "WEDNESDAY"], slotsByAxis, "en-GB"),
    ).toEqual(["MONDAY", "WEDNESDAY", "FRIDAY"]);
  });

  it("builds weekday columns and formats weekday pagination/header", () => {
    const slotsByAxis = groupSlotsByAxis(recurringSlots);
    const columns = buildAxisColumns(["MONDAY", "WEDNESDAY"], slotsByAxis);

    expect(columns).toEqual([
      {
        key: "MONDAY",
        kind: "weekday",
        rawValue: "MONDAY",
        axisWeekday: "MONDAY",
      },
      {
        key: "WEDNESDAY",
        kind: "weekday",
        rawValue: "WEDNESDAY",
        axisWeekday: "WEDNESDAY",
      },
    ]);
    expect(formatAxisHeader(columns[0], "en-US")).toEqual({ weekday: "Mon" });
    expect(formatAxisPageRange(columns[0], columns[1], "en-US")).toBe(
      "Mon ~ Wed",
    );
  });
});
