import { describe, expect, it } from "@jest/globals";
import { isVotingDeadlineComplete } from "@/lib/event/votingDeadline";
import { calendarDay } from "@/lib/time";

describe("votingDeadline", () => {
  it("is incomplete when enabled without a date", () => {
    expect(
      isVotingDeadlineComplete({
        enabled: true,
        date: null,
        time: "09:00",
      }),
    ).toBe(false);
  });

  it("is incomplete when enabled without a time", () => {
    expect(
      isVotingDeadlineComplete({
        enabled: true,
        date: calendarDay("2026-04-10"),
        time: null,
      }),
    ).toBe(false);
  });

  it("accepts a deadline far in the past", () => {
    // Hosts may deliberately set a past deadline (e.g. to close voting
    // immediately), so the deadline value itself is unconstrained.
    expect(
      isVotingDeadlineComplete({
        enabled: true,
        date: calendarDay("2020-01-01"),
        time: "09:00",
      }),
    ).toBe(true);
  });

  it("accepts a deadline that collides with the event schedule", () => {
    // A deadline later than the event start is allowed on purpose.
    expect(
      isVotingDeadlineComplete({
        enabled: true,
        date: calendarDay("2099-12-31"),
        time: "23:45",
      }),
    ).toBe(true);
  });

  it("treats a disabled deadline as complete whatever the fields hold", () => {
    expect(
      isVotingDeadlineComplete({
        enabled: false,
        date: null,
        time: "09:00",
      }),
    ).toBe(true);
  });
});
