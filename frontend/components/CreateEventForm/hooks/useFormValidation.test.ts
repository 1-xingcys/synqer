import { describe, expect, it } from "@jest/globals";
import {
  getCreateEventValidationErrors,
  ValidationError,
} from "./useFormValidation";
import { CreateEventFormData, DEFAULT_WEEKDAYS } from "../types";

function buildFormData(
  overrides: Partial<CreateEventFormData> = {},
): CreateEventFormData {
  return {
    eventType: "ONE_TIME",
    title: "Team sync",
    description: "",
    startDate: new Date(2026, 6, 20), // local 2026-07-20
    endDate: new Date(2026, 6, 20),
    weekdays: DEFAULT_WEEKDAYS,
    startTime: "09:00",
    endTime: "10:00",
    timeZone: "America/New_York",
    votingDeadlineEnabled: true,
    votingDeadline: new Date(2026, 6, 13), // local 2026-07-13
    votingDeadlineTime: "18:00",
    lineGroupId: null,
    selectedLineUserIds: [],
    ...overrides,
  };
}

describe("getCreateEventValidationErrors - voting deadline in-past check under a non-browser time zone", () => {
  it("does not flag the deadline as in the past when 'now' has not yet reached the deadline in the event's time zone", () => {
    // Event time zone is America/New_York (EDT, UTC-4 in July), which is
    // NOT the test runner's local/browser time zone (Asia/Taipei).
    // Voting deadline: naive wall-clock 2026-07-13T18:00 (America/New_York).
    //
    // "now" is the real instant 2026-07-13T21:30:00Z.
    //   - Projected into America/New_York wall-clock: 2026-07-13T17:30
    //     (still 30 minutes before the 18:00 deadline) -> should NOT be in_past.
    //   - If "now" were compared directly (raw instant) against the naive
    //     deadline Date (…T18:00:00.000Z), 21:30Z > 18:00Z would WRONGLY
    //     flag the deadline as already passed.
    const now = new Date("2026-07-13T21:30:00.000Z");

    const errors = getCreateEventValidationErrors(buildFormData(), now);

    expect(errors.has(ValidationError.DeadlineInPast)).toBe(false);
  });

  it("does flag the deadline as in the past once 'now' passes it in the event's time zone", () => {
    // Same deadline/time zone as above, but "now" has advanced past the
    // 18:00 America/New_York wall-clock deadline (18:30 wall-clock, i.e.
    // 2026-07-13T22:30:00Z in EDT).
    const now = new Date("2026-07-13T22:30:00.000Z");

    const errors = getCreateEventValidationErrors(buildFormData(), now);

    expect(errors.has(ValidationError.DeadlineInPast)).toBe(true);
  });
});
