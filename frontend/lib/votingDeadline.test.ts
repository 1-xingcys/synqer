import { describe, expect, it } from "@jest/globals";
import {
  combineVotingDeadline,
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/votingDeadline";

describe("votingDeadline", () => {
  it("encodes the picked wall-clock into UTC fields (naive)", () => {
    // 2026-07-13 as the local calendar date returned by the date picker.
    const picked = new Date(2026, 6, 13); // local 7/13 00:00
    const result = combineVotingDeadline(picked, "18:00");
    expect(result.toISOString()).toBe("2026-07-13T18:00:00.000Z");
  });

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
        date: new Date(2026, 3, 10),
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
        date: new Date(2020, 0, 1),
        time: "09:00",
      }),
    ).toBeNull();
  });

  it("accepts a deadline that collides with the event schedule", () => {
    // A deadline later than the event start is allowed on purpose.
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date(2099, 11, 31),
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
