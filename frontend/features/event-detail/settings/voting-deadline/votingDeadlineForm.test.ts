import { describe, expect, it } from "@jest/globals";
import {
  areVotingDeadlineFormsEqual,
  buildVotingDeadlineFormData,
  isVotingDeadlineFormComplete,
  isVotingDeadlineLocked,
  toVotingDeadlinePayload,
} from "./votingDeadlineForm";
import { EventStatus } from "@/types/event";
import { calendarDay } from "@/lib/time";
import { wallClock } from "@/lib/time";

describe("buildVotingDeadlineFormData", () => {
  it("reads the naive votingDeadline's wall-clock digits via UTC fields, not local getters", () => {
    // votingDeadline is stored naive: UTC fields carry the wall-clock digits
    // (date 2026-07-14, time 02:00) for the event's time zone. Reading them
    // via local Date getters is only correct when the test runner's local
    // TZ happens to be UTC — run this suite under TZ=America/Los_Angeles to
    // catch the regression (local getters would read 2026-07-13 19:00
    // instead of the correct 2026-07-14 02:00).
    const result = buildVotingDeadlineFormData(
      wallClock("2026-07-14T02:00:00.000Z"),
    );

    expect(result.deadlineEnabled).toBe(true);
    expect(result.deadlineTime).toBe("02:00");
    expect(result.deadlineDate).toBe("2026-07-14");
  });

  it("returns disabled form data when votingDeadline is null", () => {
    const result = buildVotingDeadlineFormData(null);

    expect(result).toEqual({
      deadlineEnabled: false,
      deadlineDate: null,
      deadlineTime: null,
    });
  });
});

describe("areVotingDeadlineFormsEqual", () => {
  it("ignores leftover date/time once the deadline is disabled on both sides", () => {
    const left = {
      deadlineEnabled: false,
      deadlineDate: calendarDay("2026-07-14"),
      deadlineTime: "02:00",
    };
    const right = {
      deadlineEnabled: false,
      deadlineDate: null,
      deadlineTime: null,
    };

    expect(areVotingDeadlineFormsEqual(left, right)).toBe(true);
  });

  it("reports a difference when the day or the time changes", () => {
    const base = {
      deadlineEnabled: true,
      deadlineDate: calendarDay("2026-07-14"),
      deadlineTime: "02:00",
    };

    expect(
      areVotingDeadlineFormsEqual(base, {
        ...base,
        deadlineDate: calendarDay("2026-07-15"),
      }),
    ).toBe(false);
    expect(
      areVotingDeadlineFormsEqual(base, { ...base, deadlineTime: "03:00" }),
    ).toBe(false);
    expect(
      areVotingDeadlineFormsEqual(base, { ...base, deadlineEnabled: false }),
    ).toBe(false);
  });
});

describe("isVotingDeadlineLocked", () => {
  it("locks the deadline only once the event time is confirmed", () => {
    expect(isVotingDeadlineLocked({ status: EventStatus.CONFIRMED })).toBe(
      true,
    );
    expect(isVotingDeadlineLocked({ status: EventStatus.COMPLETED })).toBe(
      true,
    );
  });

  it("keeps the deadline editable while the event is still collecting votes", () => {
    expect(isVotingDeadlineLocked({ status: EventStatus.VOTING })).toBe(false);
    expect(isVotingDeadlineLocked({ status: EventStatus.VOTING_ENDED })).toBe(
      false,
    );
  });

  it("treats a missing event as unlocked", () => {
    expect(isVotingDeadlineLocked(null)).toBe(false);
    expect(isVotingDeadlineLocked(undefined)).toBe(false);
  });
});

describe("isVotingDeadlineFormComplete", () => {
  it("requires both fields once the deadline is enabled", () => {
    expect(
      isVotingDeadlineFormComplete({
        deadlineEnabled: true,
        deadlineDate: calendarDay("2026-07-14"),
        deadlineTime: null,
      }),
    ).toBe(false);
  });

  it("accepts a disabled deadline and a fully filled one", () => {
    expect(
      isVotingDeadlineFormComplete({
        deadlineEnabled: false,
        deadlineDate: null,
        deadlineTime: null,
      }),
    ).toBe(true);
    expect(
      isVotingDeadlineFormComplete({
        deadlineEnabled: true,
        deadlineDate: calendarDay("2026-07-14"),
        deadlineTime: "02:00",
      }),
    ).toBe(true);
  });
});

describe("toVotingDeadlinePayload", () => {
  it("clears the deadline with null when disabled", () => {
    expect(
      toVotingDeadlinePayload({
        deadlineEnabled: false,
        deadlineDate: calendarDay("2026-07-14"),
        deadlineTime: "02:00",
      }),
    ).toBeNull();
  });

  it("encodes the picked day and time into the naive UTC fields", () => {
    expect(
      toVotingDeadlinePayload({
        deadlineEnabled: true,
        deadlineDate: calendarDay("2026-07-14"),
        deadlineTime: "02:00",
      }),
    ).toBe("2026-07-14T02:00:00.000Z");
  });

  it("leaves the deadline untouched when enabled but incomplete", () => {
    expect(
      toVotingDeadlinePayload({
        deadlineEnabled: true,
        deadlineDate: calendarDay("2026-07-14"),
        deadlineTime: null,
      }),
    ).toBeUndefined();
  });
});
