import { describe, expect, it } from "@jest/globals";
import {
  getDefaultVotingDeadline,
  getTodayInTimeZone,
  withSyncedVotingDeadline,
} from "./utils";
import { CreateEventFormData, DEFAULT_WEEKDAYS } from "../types";
import { DEFAULT_GRANULARITY, DEFAULT_VOTE_MODE } from "@/lib/eventPreference";

function buildFormData(
  overrides: Partial<CreateEventFormData> = {},
): CreateEventFormData {
  return {
    eventType: "ONE_TIME",
    title: "Team sync",
    description: "",
    startDate: new Date(2026, 6, 20), // local 2026-07-20
    endDate: new Date(2026, 6, 22),
    weekdays: DEFAULT_WEEKDAYS,
    startTime: "09:00",
    endTime: "17:00",
    timeZone: "America/New_York",
    defaultGranularityMin: DEFAULT_GRANULARITY,
    defaultVoteMode: DEFAULT_VOTE_MODE,
    votingDeadlineEnabled: false,
    votingDeadline: null,
    votingDeadlineTime: null,
    votingDeadlineTouched: false,
    lineGroupId: null,
    selectedLineUserIds: [],
    ...overrides,
  };
}

function toYmd(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

describe("getTodayInTimeZone", () => {
  it("uses the given time zone's calendar day, not the runner's", () => {
    // 2026-07-16T02:00Z is still 2026-07-15 22:00 in America/New_York.
    const today = getTodayInTimeZone(
      "America/New_York",
      new Date("2026-07-16T02:00:00.000Z"),
    );

    expect(toYmd(today)).toEqual([2026, 7, 15]);
  });
});

describe("getDefaultVotingDeadline - one-time events", () => {
  it("proposes the event start when it is still ahead", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");

    const result = getDefaultVotingDeadline(buildFormData(), now);

    expect(toYmd(result!.date)).toEqual([2026, 7, 20]);
    expect(result!.time).toBe("09:00");
  });

  it("falls back to the end of the window when the start has already passed", () => {
    // 2026-07-20T16:00Z = 12:00 in America/New_York, past the 09:00 start.
    // Proposing 09:00 would close voting the moment the event is created.
    const now = new Date("2026-07-20T16:00:00.000Z");

    const result = getDefaultVotingDeadline(buildFormData(), now);

    expect(toYmd(result!.date)).toEqual([2026, 7, 20]);
    expect(result!.time).toBe("17:00");
  });

  it("folds a 24:00 end time onto the last selectable deadline slot", () => {
    // The deadline TimePicker runs in "start" mode and cannot represent 24:00.
    const now = new Date("2026-07-20T16:00:00.000Z");

    const result = getDefaultVotingDeadline(
      buildFormData({ endTime: "24:00" }),
      now,
    );

    expect(result!.time).toBe("23:45");
  });

  it("returns null when no start date is picked", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");

    expect(
      getDefaultVotingDeadline(buildFormData({ startDate: null }), now),
    ).toBeNull();
  });
});

describe("getDefaultVotingDeadline - recurring events", () => {
  it("proposes one week out at the end of the daily window", () => {
    // Recurring events have no event start to track, so they get a fixed
    // week-long window to collect availability.
    const now = new Date("2026-07-13T12:00:00.000Z");

    const result = getDefaultVotingDeadline(
      buildFormData({ eventType: "RECURRING" }),
      now,
    );

    expect(toYmd(result!.date)).toEqual([2026, 7, 20]);
    expect(result!.time).toBe("17:00");
  });

  it("rolls over month boundaries", () => {
    const now = new Date("2026-07-28T12:00:00.000Z");

    const result = getDefaultVotingDeadline(
      buildFormData({ eventType: "RECURRING" }),
      now,
    );

    expect(toYmd(result!.date)).toEqual([2026, 8, 4]);
  });

  it("counts the week from today in the event's time zone", () => {
    // Still 2026-07-15 in America/New_York, so one week out is 07-22.
    const now = new Date("2026-07-16T02:00:00.000Z");

    const result = getDefaultVotingDeadline(
      buildFormData({ eventType: "RECURRING" }),
      now,
    );

    expect(toYmd(result!.date)).toEqual([2026, 7, 22]);
  });

  it("ignores the start date entirely", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");

    const result = getDefaultVotingDeadline(
      buildFormData({ eventType: "RECURRING", startDate: null }),
      now,
    );

    expect(toYmd(result!.date)).toEqual([2026, 7, 20]);
  });
});

describe("withSyncedVotingDeadline", () => {
  const now = new Date("2026-07-13T12:00:00.000Z");

  it("fills the deadline fields while untouched", () => {
    const result = withSyncedVotingDeadline(buildFormData(), now);

    expect(toYmd(result.votingDeadline!)).toEqual([2026, 7, 20]);
    expect(result.votingDeadlineTime).toBe("09:00");
  });

  it("keeps tracking the schedule as the start date moves", () => {
    const moved = withSyncedVotingDeadline(
      buildFormData({ startDate: new Date(2026, 7, 3) }),
      now,
    );

    expect(toYmd(moved.votingDeadline!)).toEqual([2026, 8, 3]);
  });

  it("leaves a host-edited deadline alone", () => {
    const edited = buildFormData({
      votingDeadline: new Date(2026, 6, 5),
      votingDeadlineTime: "12:30",
      votingDeadlineTouched: true,
    });

    const result = withSyncedVotingDeadline(edited, now);

    expect(toYmd(result.votingDeadline!)).toEqual([2026, 7, 5]);
    expect(result.votingDeadlineTime).toBe("12:30");
  });

  it("clears the proposal when there is nothing to propose", () => {
    const result = withSyncedVotingDeadline(
      buildFormData({ startDate: null }),
      now,
    );

    expect(result.votingDeadline).toBeNull();
    expect(result.votingDeadlineTime).toBeNull();
  });
});
