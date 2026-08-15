import { describe, expect, it } from "@jest/globals";
import { normalizeMyEventsResponse } from "./event-normalizers";

type Input = Parameters<typeof normalizeMyEventsResponse>[0];

function buildEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "ONE_TIME",
    capabilities: {},
    votingDeadline: null,
    confirmedSelections: [],
    schedule: {
      kind: "ONE_TIME",
      startDate: "2026-07-10T00:00:00.000Z",
      endDate: "2026-07-11T00:00:00.000Z",
      startMinuteOfDay: 540,
      endMinuteOfDay: 1080,
      slotDurationMin: 30,
    },
    ...overrides,
  };
}

function normalizeOne(overrides: Record<string, unknown> = {}) {
  return normalizeMyEventsResponse([
    buildEvent(overrides),
  ] as unknown as Input)[0];
}

// The boundary is the only place an arbitrary response string is allowed to
// become a WallClock. Asserting the brand without checking would let a
// malformed value flow on and be read as a plausible-looking time.
describe("naive time fields are validated at the boundary", () => {
  it("passes a well-formed votingDeadline through", () => {
    expect(
      normalizeOne({ votingDeadline: "2026-07-30T18:00:00.000Z" }),
    ).toHaveProperty("votingDeadline", "2026-07-30T18:00:00.000Z");
  });

  it("keeps a null votingDeadline null", () => {
    expect(normalizeOne({ votingDeadline: null })).toHaveProperty(
      "votingDeadline",
      null,
    );
  });

  // A calendar day here would be read as 00:00 on that day rather than failing.
  it("rejects a votingDeadline that is only a calendar day", () => {
    expect(() => normalizeOne({ votingDeadline: "2026-07-30" })).toThrow(
      /not a wall clock/i,
    );
  });

  it("rejects a votingDeadline carrying a zone offset", () => {
    expect(() =>
      normalizeOne({ votingDeadline: "2026-07-30T18:00:00+08:00" }),
    ).toThrow(/not a wall clock/i);
  });

  it("passes well-formed confirmed selection times through", () => {
    const out = normalizeOne({
      confirmedSelections: [
        {
          kind: "ONE_TIME_RANGE",
          slotIds: [],
          startTime: "2026-07-30T18:00:00.000Z",
          endTime: "2026-07-30T20:00:00.000Z",
        },
      ],
    });

    expect(out.confirmedSelections[0]).toMatchObject({
      startTime: "2026-07-30T18:00:00.000Z",
      endTime: "2026-07-30T20:00:00.000Z",
    });
  });

  it("rejects a malformed confirmed selection time", () => {
    expect(() =>
      normalizeOne({
        confirmedSelections: [
          { kind: "ONE_TIME_RANGE", slotIds: [], startTime: "2026-07-30" },
        ],
      }),
    ).toThrow(/not a wall clock/i);
  });

  // Weekday selections carry startMinute/endMinute instead, so absent times
  // must stay absent rather than being rejected.
  it("leaves a weekday selection without times alone", () => {
    const out = normalizeOne({
      confirmedSelections: [
        {
          kind: "WEEKDAY_RANGE",
          slotIds: [],
          weekday: "MONDAY",
          startMinute: 540,
          endMinute: 600,
        },
      ],
    });

    expect(out.confirmedSelections[0]).toMatchObject({ weekday: "MONDAY" });
  });
});
