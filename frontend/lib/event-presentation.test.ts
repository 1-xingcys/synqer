import { describe, expect, it } from "@jest/globals";
import { EventWithCapabilities, EventSchedule } from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventCandidateDaySummary,
} from "@/lib/event-presentation";

type EventFixture = EventWithCapabilities & {
  schedule?: EventSchedule;
  type?: import("@/types/event").EventType;
};

const recurringEvent: EventFixture = {
  type: "RECURRING",
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

const oneTimeEvent: EventFixture = {
  type: "ONE_TIME",
  capabilities: {
    supportsCompletion: false,
    supportsCalendarConflict: false,
    supportsAddToCalendar: false,
  },
  schedule: {
    kind: "ONE_TIME",
    // Candidate dates are naive calendar days stored at UTC midnight.
    startDate: "2026-07-30T00:00:00.000Z",
    endDate: "2026-08-02T00:00:00.000Z",
    startMinuteOfDay: 540,
    endMinuteOfDay: 660,
    slotDurationMin: 30,
  },
};

describe("event-presentation", () => {
  it("formats recurring candidate day summary without time range", () => {
    expect(formatEventCandidateDaySummary(recurringEvent, "en-US")).toBe(
      "Mon, Wed, Fri",
    );
  });

  it("uses short weekday labels in zh-TW rather than narrow ones", () => {
    expect(formatEventCandidateDaySummary(recurringEvent, "zh-TW")).toBe(
      "週一, 週三, 週五",
    );
  });

  // Reading these UTC-midnight values with local getters shifts them to the
  // previous day for viewers west of UTC. Run under `TZ=America/New_York` to
  // exercise that path; the assertion itself holds in every zone.
  it("keeps one-time candidate dates on the stored calendar day", () => {
    expect(formatEventCandidateDaySummary(oneTimeEvent, "en-US")).toBe(
      "2026/07/30 ~ 2026/08/02",
    );
  });

  it("formats weekday axis keys for recurring grids", () => {
    expect(formatAxisKeyLabel("WEDNESDAY", "WEEKDAY", "en-US")).toBe("Wed");
  });

  // Date axis keys are date-only calendar days, which parse as UTC midnight;
  // reading them with local getters shifts them to the previous day for viewers
  // west of UTC. Run under `TZ=America/New_York` to exercise that path — the
  // label has to match the column header the user clicked in every zone.
  it("keeps date axis keys on the stored calendar day", () => {
    expect(formatAxisKeyLabel("2026-07-30", "DATE", "en-US")).toBe("7/30");
    expect(formatAxisKeyLabel("2026-01-01", "DATE", "en-US")).toBe("1/1");
  });
});
