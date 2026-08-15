import { normalizeMyEventsResponse } from "./event-normalizers";

describe("normalizeMyEventsResponse", () => {
  it("preserves isHost/hasVoted and normalizes schedule", () => {
    const input = [
      {
        id: "e1",
        type: "ONE_TIME",
        title: "T",
        description: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        votingDeadline: null,
        confirmedSlotIds: [],
        confirmedSelections: [],
        status: "VOTING",
        capabilities: {
          supportsCompletion: true,
          supportsCalendarConflict: false,
          supportsAddToCalendar: false,
        },
        expectedParticipantCount: 3,
        votedCount: 1,
        hasVoted: true,
        isHost: true,
        host: null,
        schedule: {
          kind: "ONE_TIME",
          startDate: "2026-07-10T00:00:00.000Z",
          endDate: "2026-07-11T00:00:00.000Z",
          startMinuteOfDay: 540,
          endMinuteOfDay: 1080,
          slotDurationMin: 30,
        },
      },
    ] as unknown as Parameters<typeof normalizeMyEventsResponse>[0];

    const [out] = normalizeMyEventsResponse(input);
    expect(out.isHost).toBe(true);
    expect(out.hasVoted).toBe(true);
    expect(out.schedule.kind).toBe("ONE_TIME");
  });

  // The wire sends candidate days as naive UTC-midnight timestamps. Converting
  // them at the boundary is what stops every downstream reader from having to
  // decide how to parse them — the mistake that shifted these dates a day for
  // viewers west of UTC. Holds in every runner zone.
  it("converts candidate days to calendar days at the boundary", () => {
    const input = [
      {
        schedule: {
          kind: "ONE_TIME",
          startDate: "2026-07-10T00:00:00.000Z",
          endDate: "2026-07-11T00:00:00.000Z",
          startMinuteOfDay: 540,
          endMinuteOfDay: 1080,
          slotDurationMin: 30,
        },
        type: "ONE_TIME",
        capabilities: {},
      },
    ] as unknown as Parameters<typeof normalizeMyEventsResponse>[0];

    const [out] = normalizeMyEventsResponse(input);

    expect(out.schedule).toMatchObject({
      kind: "ONE_TIME",
      startDate: "2026-07-10",
      endDate: "2026-07-11",
    });
  });
});
