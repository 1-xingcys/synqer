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

describe("getCreateEventValidationErrors - voting deadline", () => {
  it("accepts a deadline that has already passed", () => {
    // Deadline 2026-07-13 18:00 (event time zone); "now" is a day later.
    const now = new Date("2026-07-14T22:30:00.000Z");

    const errors = getCreateEventValidationErrors(buildFormData(), now);

    expect(errors.size).toBe(0);
  });

  it("accepts a deadline later than the event start time", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");

    const errors = getCreateEventValidationErrors(
      buildFormData({
        // Event starts 2026-07-20 09:00; deadline lands well after that.
        votingDeadline: new Date(2026, 6, 25),
        votingDeadlineTime: "23:00",
      }),
      now,
    );

    expect(errors.size).toBe(0);
  });

  it("still requires both fields once the deadline is enabled", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");

    const errors = getCreateEventValidationErrors(
      buildFormData({ votingDeadlineTime: null }),
      now,
    );

    expect(errors.has(ValidationError.DeadlineRequired)).toBe(true);
  });
});
