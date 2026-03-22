import { describe, expect, it } from "@jest/globals";
import { buildHostedEventResultFlexMessageFromSummary } from "@/lib/line-flex-message/hostedEventResultFlexMessage";

type FlexTextNode = {
  text?: string;
};

type FlexBoxNode = {
  contents?: Array<FlexBoxNode | FlexTextNode>;
};

describe("hostedEventResultFlexMessage", () => {
  it("formats recurring confirmed ranges with the shared confirmed format", () => {
    const message = buildHostedEventResultFlexMessageFromSummary({
      eventId: "event-1",
      eventTitle: "Team Sync",
      locale: "en-US",
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

    const bodyContents = (
      message.contents as {
        body: { contents: FlexBoxNode[] };
      }
    ).body.contents;
    const rangeSection = bodyContents[2];
    const slotLabel = (rangeSection.contents?.[0] as FlexBoxNode | undefined)
      ?.contents?.[0] as FlexTextNode | undefined;

    expect(slotLabel?.text).toBe("(Mon) 10:00 - 12:00");
  });
});
