import { describe, expect, it } from "@jest/globals";
import {
  formatVotingDeadlineWallClock,
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/event-time";
import { calendarDayToWallClock } from "@/lib/time";
import { calendarDay } from "@/lib/time";
import { wallClock } from "@/lib/time";

describe("votingDeadline", () => {
  it("returns required when enabled without a date", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: null,
        time: "09:00",
      }),
    ).toBe(VOTING_DEADLINE_ERROR.REQUIRED);
  });

  it("returns required when enabled without a time", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: calendarDay("2026-04-10"),
        time: null,
      }),
    ).toBe(VOTING_DEADLINE_ERROR.REQUIRED);
  });

  it("accepts a deadline far in the past", () => {
    // Hosts may deliberately set a past deadline (e.g. to close voting
    // immediately), so the deadline value itself is unconstrained.
    expect(
      validateVotingDeadline({
        enabled: true,
        date: calendarDay("2020-01-01"),
        time: "09:00",
      }),
    ).toBeNull();
  });

  it("accepts a deadline that collides with the event schedule", () => {
    // A deadline later than the event start is allowed on purpose.
    expect(
      validateVotingDeadline({
        enabled: true,
        date: calendarDay("2099-12-31"),
        time: "23:45",
      }),
    ).toBeNull();
  });

  it("returns null when deadline is disabled", () => {
    expect(
      validateVotingDeadline({
        enabled: false,
        date: null,
        time: "09:00",
      }),
    ).toBeNull();
  });
});

describe("formatVotingDeadlineWallClock", () => {
  it("shows the digits the host picked, not a zone-shifted instant", () => {
    // 18:00 is late enough that any eastward viewer zone would roll the day.
    expect(
      formatVotingDeadlineWallClock(wallClock("2026-07-30T18:00:00.000Z")),
    ).toBe("2026/07/30 18:00");
    // 02:00 is early enough that any westward viewer zone would roll it back.
    expect(
      formatVotingDeadlineWallClock(wallClock("2026-07-30T02:00:00.000Z")),
    ).toBe("2026/07/30 02:00");
  });

  it("round-trips a deadline produced by calendarDayToWallClock", () => {
    const picked = calendarDayToWallClock(calendarDay("2026-07-13"), "18:00");
    expect(formatVotingDeadlineWallClock(picked)).toBe("2026/07/13 18:00");
  });
});
