import { describe, expect, it } from "@jest/globals";
import { buildEventShareBubbleFields } from "@/lib/line-flex-message";
import { wallClock } from "@/lib/time";
import { buildVoteInviteShareText } from "./voteInviteShareText";

const SHARE_URL = "https://synqer.app/events/event-1";
// Naive wall clock: the UTC fields carry the digits for the event's own zone.
const DEADLINE = wallClock("2026-08-20T18:00:00Z");

describe("buildVoteInviteShareText", () => {
  it("puts the title, the instruction and the link on their own blocks", () => {
    const text = buildVoteInviteShareText({
      eventTitle: "聚餐時間",
      shareUrl: SHARE_URL,
      locale: "zh-TW",
    });

    expect(text).toBe(
      ["[投票] 聚餐時間", "", "請點選投票連結進行投票", "", SHARE_URL].join(
        "\n",
      ),
    );
  });

  it("writes English copy for any other locale", () => {
    const text = buildVoteInviteShareText({
      eventTitle: "Team Sync",
      shareUrl: SHARE_URL,
      locale: "en",
    });

    expect(text).toBe(
      [
        "[Vote] Team Sync",
        "",
        "Open the link below to vote",
        "",
        SHARE_URL,
      ].join("\n"),
    );
  });

  it("hangs the deadline directly under the title, not as its own paragraph", () => {
    const text = buildVoteInviteShareText({
      eventTitle: "聚餐時間",
      shareUrl: SHARE_URL,
      locale: "zh-TW",
      votingDeadline: DEADLINE,
    });

    expect(text).toBe(
      [
        "[投票] 聚餐時間",
        "截止：8/20（四）18:00",
        "",
        "請點選投票連結進行投票",
        "",
        SHARE_URL,
      ].join("\n"),
    );
  });

  it.each([
    ["with a deadline", DEADLINE, SHARE_URL],
    ["without a deadline", undefined, SHARE_URL],
    ["without a deadline, before the URL resolves", undefined, ""],
  ] as const)(
    "never leaves a run of blank lines %s",
    (_case, votingDeadline, shareUrl) => {
      // A null deadline used to be joined through as an empty block, which put
      // two bare newlines in the middle of the message.
      const text = buildVoteInviteShareText({
        eventTitle: "聚餐時間",
        shareUrl,
        locale: "zh-TW",
        votingDeadline,
      });

      expect(text).not.toMatch(/\n{3,}/);
    },
  );

  it.each(["zh-TW", "en"])(
    "opens on the same title line the flex bubble uses (%s)",
    (locale) => {
      // The two forms of one invite must announce themselves identically, so
      // this is asserted against the bubble rather than against a copy of its
      // wording.
      const { titleText } = buildEventShareBubbleFields({
        title: "聚餐時間",
        locale,
      });

      const text = buildVoteInviteShareText({
        eventTitle: "聚餐時間",
        shareUrl: SHARE_URL,
        locale,
      });

      expect(text.split("\n")[0]).toBe(titleText);
    },
  );

  it("falls back to the untitled label when the event has no title", () => {
    const text = buildVoteInviteShareText({
      eventTitle: "   ",
      shareUrl: SHARE_URL,
      locale: "zh-TW",
    });

    expect(text.startsWith("[投票] 未命名活動")).toBe(true);
  });

  it("ends on the link so chat clients linkify it", () => {
    // A trailing blank line would be pasted into LINE as an empty message
    // tail, and anything after the URL risks being swallowed into the link.
    const text = buildVoteInviteShareText({
      eventTitle: "Team Sync",
      shareUrl: SHARE_URL,
      locale: "en",
      votingDeadline: DEADLINE,
    });

    expect(text.endsWith(SHARE_URL)).toBe(true);
  });

  it("omits the link block entirely before the share URL is known", () => {
    // useEventShareLink returns "" during SSR, and a message trailing two
    // blank lines is worse than one that simply has no link yet.
    const text = buildVoteInviteShareText({
      eventTitle: "Team Sync",
      shareUrl: "",
      locale: "zh-TW",
    });

    expect(text).toBe("[投票] Team Sync\n\n請點選投票連結進行投票");
  });
});
