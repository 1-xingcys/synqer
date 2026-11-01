import { describe, expect, it } from "@jest/globals";
import { buildHostedEventResultFlexMessageFromSummary } from "@/lib/line/line-flex-message/hostedEventResultFlexMessage";

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
            axis: { axisType: "WEEKDAY", weekday: "MONDAY" },
            startMinute: 600,
            endMinute: 720,
            availableCount: 2,
            unavailableParticipants: [{ name: "Alex" }],
          },
        ],
        notVotedParticipants: [],
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

  it("puts one not-voted row after every range", () => {
    const range = {
      axis: { axisType: "WEEKDAY", weekday: "MONDAY" },
      startMinute: 600,
      endMinute: 720,
      availableCount: 1,
      unavailableParticipants: [{ name: "Ben" }],
    } as const;
    const message = buildHostedEventResultFlexMessageFromSummary({
      eventId: "event-1",
      eventTitle: "Team Sync",
      locale: "en-US",
      summary: {
        totalExpected: 3,
        ranges: [
          { ...range, unavailableParticipants: [{ name: "Ben" }] },
          { ...range, unavailableParticipants: [{ name: "Ben" }] },
        ],
        notVotedParticipants: [{ name: "Cat" }],
      },
    });

    const bodyContents = (
      message.contents as {
        body: { contents: FlexBoxNode[] };
      }
    ).body.contents;
    const lastRow = bodyContents[bodyContents.length - 1];

    expect(bodyContents).toHaveLength(5);
    expect((lastRow.contents?.[1] as FlexTextNode).text).toBe("Cat");
    expect(JSON.stringify(bodyContents).match(/Not voted/g)).toHaveLength(1);
  });
});
