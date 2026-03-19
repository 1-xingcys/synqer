import { describe, expect, it } from "@jest/globals";
import { EventWithCapabilities, EventSchedule } from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventCandidateDaySummary,
  formatEventScheduleSummary,
} from "@/lib/event-presentation";

type EventFixture = EventWithCapabilities & {
  schedule?: EventSchedule;
  type?: import("@/types/event").EventType;
  weekdays?: import("@/types/event").Weekday[];
};

const recurringEvent: EventFixture = {
  type: "RECURRING",
  weekdays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  capabilities: {
    supportsCompletion: false,
    supportsCalendarConflict: false,
    supportsAddToCalendar: false,
  },
  schedule: {
    kind: "RECURRING",
    weekdays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
    startMinuteOfDay: 540,
    endMinuteOfDay: 660,
    slotDurationMin: 30,
  },
};

describe("event-presentation", () => {
  it("formats recurring schedule summary with weekday labels and time range", () => {
    expect(formatEventScheduleSummary(recurringEvent, "en-US")).toBe(
      "Mon, Wed, Fri • 09:00 ~ 11:00",
    );
  });

  it("formats recurring candidate day summary without time range", () => {
    expect(formatEventCandidateDaySummary(recurringEvent, "en-US")).toBe(
      "Mon, Wed, Fri",
    );
  });

  it("formats weekday axis keys for recurring grids", () => {
    expect(formatAxisKeyLabel("WEDNESDAY", "WEEKDAY", "en-US")).toBe("Wed");
  });
});
