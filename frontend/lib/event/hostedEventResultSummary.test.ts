import { buildHostedEventResultSummary } from "./hostedEventResultSummary";

describe("buildHostedEventResultSummary", () => {
  it("separates not-voted participants from unavailable ones", () => {
    const summary = buildHostedEventResultSummary({
      confirmedSlots: [
        {
          id: "s1",
          axisType: "DATE",
          axisDate: "2026-11-10",
          startMinute: 540,
          endMinute: 600,
        },
      ],
      votes: [{ slotId: "s1", userId: "a" }],
      expectedParticipants: [
        { id: "1", userId: "a", displayName: "Amy", hasVoted: true },
        { id: "2", userId: "b", displayName: "Ben", hasVoted: true },
        { id: "3", userId: "c", displayName: "Cat", hasVoted: false },
      ],
    });

    expect(summary.totalExpected).toBe(3);
    expect(summary.ranges[0].availableCount).toBe(1);
    expect(summary.ranges[0].unavailableParticipants).toEqual([
      { name: "Ben" },
    ]);
    expect(summary.notVotedParticipants).toEqual([{ name: "Cat" }]);
  });
});
