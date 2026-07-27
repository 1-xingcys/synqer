import { describe, expect, it } from "@jest/globals";
import {
  getCreateEventValidationErrors,
  hasCreateEventUnsavedChanges,
  ValidationError,
} from "./useFormValidation";
import { VoteMode } from "@/types/event";
import { CreateEventFormData, DEFAULT_WEEKDAYS } from "../types";
import {
  DEFAULT_GRANULARITY,
  DEFAULT_SHARE_VOTE_TO_CHAT,
  DEFAULT_VOTE_MODE,
} from "@/lib/eventPreference";

function buildFormData(
  overrides: Partial<CreateEventFormData> = {},
): CreateEventFormData {
  return {
    eventType: "ONE_TIME",
    title: "Team sync",
    description: "",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    weekdays: DEFAULT_WEEKDAYS,
    startTime: "09:00",
    endTime: "10:00",
    timeZone: "America/New_York",
    defaultGranularityMin: DEFAULT_GRANULARITY,
    defaultVoteMode: DEFAULT_VOTE_MODE,
    shareVoteToChat: DEFAULT_SHARE_VOTE_TO_CHAT,
    votingDeadlineEnabled: true,
    votingDeadline: "2026-07-13",
    votingDeadlineTime: "18:00",
    votingDeadlineTouched: false,
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
        votingDeadline: "2026-07-25",
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

describe("getCreateEventValidationErrors - start date", () => {
  it("accepts today as the start date even when the start time has passed", () => {
    // "now" is 2026-07-20T16:00Z = 12:00 in America/New_York (EDT), so the
    // event's 09:00 start slot is already three hours gone. The voting window
    // may still legitimately span the whole day.
    const now = new Date("2026-07-20T16:00:00.000Z");

    const errors = getCreateEventValidationErrors(buildFormData(), now);

    expect(errors.has(ValidationError.StartDateInPast)).toBe(false);
  });

  it("rejects a start date before today", () => {
    const now = new Date("2026-07-20T16:00:00.000Z");

    const errors = getCreateEventValidationErrors(
      buildFormData({
        startDate: "2026-07-19",
        endDate: "2026-07-19",
      }),
      now,
    );

    expect(errors.has(ValidationError.StartDateInPast)).toBe(true);
  });

  it("resolves 'today' in the event's time zone, not the browser's", () => {
    // 2026-07-16T02:00Z is still 2026-07-15 22:00 in America/New_York, so a
    // 2026-07-15 start date is today there and must be accepted — even though
    // UTC (and any runner east of it) has already rolled over to 07-16.
    const now = new Date("2026-07-16T02:00:00.000Z");

    const errors = getCreateEventValidationErrors(
      buildFormData({
        startDate: "2026-07-15",
        endDate: "2026-07-15",
      }),
      now,
    );

    expect(errors.has(ValidationError.StartDateInPast)).toBe(false);
  });

  it("does not apply the start date rule to recurring events", () => {
    const now = new Date("2026-07-20T16:00:00.000Z");

    const errors = getCreateEventValidationErrors(
      buildFormData({
        eventType: "RECURRING",
        startDate: "2020-01-01",
        endDate: "2020-01-01",
      }),
      now,
    );

    expect(errors.has(ValidationError.StartDateInPast)).toBe(false);
  });
});

describe("hasCreateEventUnsavedChanges - grid preferences", () => {
  it("reports no changes for an untouched form", () => {
    const initial = buildFormData();

    expect(hasCreateEventUnsavedChanges(buildFormData(), initial)).toBe(false);
  });

  it("notices a changed view granularity", () => {
    const initial = buildFormData();

    expect(
      hasCreateEventUnsavedChanges(
        buildFormData({ defaultGranularityMin: 60 }),
        initial,
      ),
    ).toBe(true);
  });

  it("notices a changed vote mode", () => {
    const initial = buildFormData();

    expect(
      hasCreateEventUnsavedChanges(
        buildFormData({ defaultVoteMode: VoteMode.UNAVAILABLE }),
        initial,
      ),
    ).toBe(true);
  });

  it("notices the vote notice being turned off", () => {
    const initial = buildFormData();

    expect(
      hasCreateEventUnsavedChanges(
        buildFormData({ shareVoteToChat: false }),
        initial,
      ),
    ).toBe(true);
  });
});
