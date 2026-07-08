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
});
