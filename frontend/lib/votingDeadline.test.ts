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
        date: new Date("2026-04-10T00:00:00Z"),
        time: null,
      }),
    ).toBe(VOTING_DEADLINE_ERROR.REQUIRED);
  });

  it("returns in_past when deadline is earlier than the minimum", () => {
    // minDateTime/maxDateTime must be supplied in the same naive
    // wall-clock space (UTC fields carry the digits) as the combined
    // deadline; see validateVotingDeadline's doc comment.
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00Z"),
        time: "09:00",
        minDateTime: new Date("2026-04-10T10:00:00Z"),
      }),
    ).toBe(VOTING_DEADLINE_ERROR.IN_PAST);
  });

  it("returns after_max when deadline is later than the maximum", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00Z"),
        time: "11:00",
        maxDateTime: new Date("2026-04-10T10:00:00Z"),
      }),
    ).toBe(VOTING_DEADLINE_ERROR.AFTER_MAX);
  });

  it("returns null when deadline is valid", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00Z"),
        time: "09:00",
        minDateTime: new Date("2026-04-10T08:00:00Z"),
        maxDateTime: new Date("2026-04-10T10:00:00Z"),
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
