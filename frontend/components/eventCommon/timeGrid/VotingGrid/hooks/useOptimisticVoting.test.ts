import { describe, expect, it } from "@jest/globals";
import { shouldShareVoteNotice } from "./useOptimisticVoting";

const inLiffFirstVote = {
  shareVoteToChat: true,
  isInLiffClient: true,
  hadVotedBeforeCommit: false,
};

describe("shouldShareVoteNotice", () => {
  it("posts the notice on a first vote inside LIFF", () => {
    expect(shouldShareVoteNotice(inLiffFirstVote)).toBe(true);
  });

  it("stays silent when the host turned the notice off", () => {
    expect(
      shouldShareVoteNotice({ ...inLiffFirstVote, shareVoteToChat: false }),
    ).toBe(false);
  });

  it("stays silent outside LIFF, where there is no chat to post into", () => {
    expect(
      shouldShareVoteNotice({ ...inLiffFirstVote, isInLiffClient: false }),
    ).toBe(false);
  });

  it("stays silent on a re-vote, which already announced once", () => {
    expect(
      shouldShareVoteNotice({ ...inLiffFirstVote, hadVotedBeforeCommit: true }),
    ).toBe(false);
  });
});
