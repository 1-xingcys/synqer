import { describe, expect, it } from "@jest/globals";
import { buildHostedEventResultTextFromSummary } from "@/components/hostedEvent/hostedEventResultText";

describe("hostedEventResultText", () => {
  it("formats recurring confirmed ranges with the shared confirmed format", () => {
    const result = buildHostedEventResultTextFromSummary({
      eventTitle: "Team Sync",
      locale: "en-US",
      copy: {
        title: "Confirmed result",
        eventLine: (eventTitle) => `Event: ${eventTitle}`,
        availableLine: (availableCount, totalExpected) =>
          `Available: ${availableCount}/${totalExpected}`,
        unavailableLine: (names) => `Unavailable: ${names}`,
        none: "None",
      },
      summary: {
        totalExpected: 3,
        ranges: [
          {
            axisType: "WEEKDAY",
            startDate: "MONDAY",
            endDate: "MONDAY",
            startMinute: 600,
            endMinute: 720,
            availableCount: 2,
            unavailableParticipants: [{ name: "Alex" }],
          },
        ],
      },
    });

    expect(result).toContain("1. (Mon) 10:00 - 12:00");
  });
});
