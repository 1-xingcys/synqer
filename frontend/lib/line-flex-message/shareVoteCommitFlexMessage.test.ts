import { describe, expect, it } from "@jest/globals";
import {
  buildVoteCommitShareFlexMessage,
  getVoteShareCopy,
} from "@/lib/line-flex-message/shareVoteCommitFlexMessage";

type FlexTextNode = {
  type?: string;
  text?: string;
};

describe("getVoteShareCopy", () => {
  it("falls back to English for anything that is not zh-TW", () => {
    expect(getVoteShareCopy("").votedText).toBe("Voted");
    expect(getVoteShareCopy("en").votedText).toBe("Voted");
    // The old signature took a "/zh-TW" path prefix; a stale caller passing one
    // must not silently keep working and hide the mismatch.
    expect(getVoteShareCopy("/zh-TW").votedText).toBe("Voted");
  });

  it("returns Traditional Chinese copy for zh-TW", () => {
    expect(getVoteShareCopy("zh-TW").votedText).toBe("已投票");
  });
});

describe("buildVoteCommitShareFlexMessage", () => {
  // The settings preview renders getVoteShareCopy's output directly, so it can
  // only stay honest as long as the bubble is built from the same strings.
  it("builds the bubble from getVoteShareCopy", () => {
    const copy = getVoteShareCopy("");
    const { flexMessage } = buildVoteCommitShareFlexMessage({
      eventId: "event-1",
      eventTitle: "Team Dinner",
      voterUserId: "user-1",
    });

    const bubble = flexMessage.contents as {
      body: { contents: FlexTextNode[] };
      footer: { contents: { action: { label: string } }[] };
    };

    expect(bubble.body.contents[0].text).toBe(copy.votedText);
    expect(bubble.body.contents[1].text).toBe(`${copy.eventPrefix}Team Dinner`);
    expect(bubble.footer.contents.map((button) => button.action.label)).toEqual(
      [copy.viewLabel, copy.goVote],
    );
  });

  it("falls back to the untitled label when the event has no title", () => {
    const copy = getVoteShareCopy("");
    const { flexMessage } = buildVoteCommitShareFlexMessage({
      eventId: "event-1",
      eventTitle: "",
      voterUserId: "user-1",
    });

    const bubble = flexMessage.contents as {
      body: { contents: FlexTextNode[] };
    };

    expect(bubble.body.contents[1].text).toBe(
      `${copy.eventPrefix}${copy.untitledEvent}`,
    );
  });
});
