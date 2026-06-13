import { describe, expect, it } from "@jest/globals";
import {
  combineVotingDeadline,
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/votingDeadline";

describe("votingDeadline", () => {
  it("combines date and time into a local datetime", () => {
    const date = new Date("2026-04-10T00:00:00");

    const result = combineVotingDeadline(date, "09:30");

    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
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
        date: new Date("2026-04-10T00:00:00"),
        time: null,
      }),
    ).toBe(VOTING_DEADLINE_ERROR.REQUIRED);
  });

  it("returns in_past when deadline is earlier than the minimum", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00"),
        time: "09:00",
        minDateTime: new Date("2026-04-10T10:00:00"),
      }),
    ).toBe(VOTING_DEADLINE_ERROR.IN_PAST);
  });

  it("returns after_max when deadline is later than the maximum", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00"),
        time: "11:00",
        maxDateTime: new Date("2026-04-10T10:00:00"),
      }),
    ).toBe(VOTING_DEADLINE_ERROR.AFTER_MAX);
  });

  it("returns null when deadline is valid", () => {
    expect(
      validateVotingDeadline({
        enabled: true,
        date: new Date("2026-04-10T00:00:00"),
        time: "09:00",
        minDateTime: new Date("2026-04-10T08:00:00"),
        maxDateTime: new Date("2026-04-10T10:00:00"),
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
