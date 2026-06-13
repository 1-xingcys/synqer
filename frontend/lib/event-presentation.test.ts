import { describe, expect, it } from "@jest/globals";
import { EventWithCapabilities, EventSchedule } from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventCandidateDaySummary,
  formatEventScheduleSummary,
  getVotingDeadlineCountdownState,
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

  it("derives countdown and urgency for active deadlines", () => {
    const now = new Date("2026-04-06T00:00:00.000Z");

    expect(
      getVotingDeadlineCountdownState("2026-04-06T05:30:00.000Z", now),
    ).toMatchObject({
      isExpired: false,
      days: 0,
      hours: 5,
      minutes: 30,
      totalHours: 5,
      isUrgent: true,
      isVeryCritical: true,
    });
  });

  it("marks expired deadlines and suppresses urgency when inactive", () => {
    const now = new Date("2026-04-06T12:00:00.000Z");

    expect(
      getVotingDeadlineCountdownState("2026-04-06T11:00:00.000Z", now, true),
    ).toMatchObject({
      isExpired: true,
      isUrgent: false,
      isVeryCritical: false,
    });
  });

  it("returns an empty countdown state when deadline is not set", () => {
    const now = new Date("2026-04-06T12:00:00.000Z");

    expect(getVotingDeadlineCountdownState(null, now)).toMatchObject({
      deadlineDate: null,
      isExpired: false,
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0,
      isUrgent: false,
      isVeryCritical: false,
    });
  });
});
