import { describe, expect, it } from "@jest/globals";
import { EventWithCapabilities, EventSchedule } from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventCandidateDaySummary,
  formatEventScheduleSummary,
  formatVotingDeadlineShort,
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
      getVotingDeadlineCountdownState("2026-04-06T05:30:00.000Z", now, "UTC"),
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
      getVotingDeadlineCountdownState(
        "2026-04-06T11:00:00.000Z",
        now,
        "UTC",
        true,
      ),
    ).toMatchObject({
      isExpired: true,
      isUrgent: false,
      isVeryCritical: false,
    });
  });

  it("returns an empty countdown state when deadline is not set", () => {
    const now = new Date("2026-04-06T12:00:00.000Z");

    expect(getVotingDeadlineCountdownState(null, now, "UTC")).toMatchObject({
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

  it("resolves the naive wall-clock deadline via event.timeZone before diffing against a real instant", () => {
    // Naive wall-clock deadline stored as "...T05:30:00Z" means 05:30 local
    // time in the event's zone (Asia/Taipei, UTC+8) -> real instant
    // 2026-04-05T21:30:00.000Z.
    //
    // `now` is a REAL instant just before that: 2026-04-05T21:00:00.000Z.
    // Treating the naive value as a raw browser-local/UTC instant (old,
    // wrong behavior) would compare "2026-04-06T05:30:00Z" directly against
    // now, yielding isExpired: false and totalHours: 8 (way in the future).
    // Resolving it through Asia/Taipei gives the correct near-term result:
    // isExpired: false, totalHours: 0 (30 minutes away).
    const now = new Date("2026-04-05T21:00:00.000Z");

    const wrongIfTreatedAsRawInstant = getVotingDeadlineCountdownState(
      "2026-04-06T05:30:00.000Z",
      now,
      "UTC",
    );
    expect(wrongIfTreatedAsRawInstant.totalHours).toBe(8);
    expect(wrongIfTreatedAsRawInstant.isExpired).toBe(false);

    const resolved = getVotingDeadlineCountdownState(
      "2026-04-06T05:30:00.000Z",
      now,
      "Asia/Taipei",
    );
    expect(resolved.isExpired).toBe(false);
    expect(resolved.totalHours).toBe(0);
    expect(resolved.minutes).toBe(30);

    // Sanity: once `now` passes the real instant, it must report expired,
    // proving the countdown is anchored to the resolved instant, not the
    // raw naive digits.
    const afterDeadline = new Date("2026-04-05T21:30:01.000Z");
    expect(
      getVotingDeadlineCountdownState(
        "2026-04-06T05:30:00.000Z",
        afterDeadline,
        "Asia/Taipei",
      ).isExpired,
    ).toBe(true);
  });

  it("formats the voting deadline in the event's time zone, not the host's", () => {
    // Fixed real instant: 2026-07-13T09:00:00.000Z.
    const instant = new Date("2026-07-13T09:00:00.000Z");

    // Asia/Tokyo is UTC+9 -> 18:00 local on 7/13.
    expect(formatVotingDeadlineShort(instant, "Asia/Tokyo")).toBe("7/13 18:00");

    // America/New_York is UTC-4 in July (EDT) -> 05:00 local on 7/13.
    expect(formatVotingDeadlineShort(instant, "America/New_York")).toBe(
      "7/13 05:00",
    );
  });
});
