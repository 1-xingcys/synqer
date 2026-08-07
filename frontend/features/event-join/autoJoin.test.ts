import { describe, expect, it } from "@jest/globals";
import { postJoinRedirectPath, shouldAutoJoin } from "./autoJoin";
import { EventStatus } from "@/types/event";

const arrivedAsStranger = {
  isAuthenticated: true,
  isParticipant: false,
  eventExists: true,
  isDeleted: false,
  hasError: false,
  hasAttempted: false,
};

describe("shouldAutoJoin", () => {
  it("joins someone who opened the link but is not on the participant list", () => {
    expect(shouldAutoJoin(arrivedAsStranger)).toBe(true);
  });

  // A LIFF entry renders the page while the login handshake is still running.
  // Joining then would POST without a session and fail with a 401.
  it("waits for the session before joining anyone", () => {
    expect(
      shouldAutoJoin({ ...arrivedAsStranger, isAuthenticated: false }),
    ).toBe(false);
  });

  it("stays put for someone already on the participant list", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, isParticipant: true })).toBe(
      false,
    );
  });

  it("waits while the participation status is still unresolved", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, isParticipant: null })).toBe(
      false,
    );
  });

  it("does not join a deleted event", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, isDeleted: true })).toBe(
      false,
    );
  });

  it("does not join an event that could not be loaded", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, eventExists: false })).toBe(
      false,
    );
  });

  it("does not retry on its own after a failure", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, hasError: true })).toBe(
      false,
    );
  });

  it("fires only once, even while the request is still in flight", () => {
    expect(shouldAutoJoin({ ...arrivedAsStranger, hasAttempted: true })).toBe(
      false,
    );
  });
});

describe("postJoinRedirectPath", () => {
  it("sends a joiner straight to the vote tab while voting is open", () => {
    expect(postJoinRedirectPath("evt_1", EventStatus.VOTING)).toBe(
      "/events/evt_1/vote",
    );
  });

  it("sends a joiner to the overview tab once voting has ended", () => {
    expect(postJoinRedirectPath("evt_1", EventStatus.VOTING_ENDED)).toBe(
      "/events/evt_1/overview",
    );
  });

  it("sends a joiner to the overview tab on a confirmed event", () => {
    expect(postJoinRedirectPath("evt_1", EventStatus.CONFIRMED)).toBe(
      "/events/evt_1/overview",
    );
  });

  it("sends a joiner to the overview tab on a completed event", () => {
    expect(postJoinRedirectPath("evt_1", EventStatus.COMPLETED)).toBe(
      "/events/evt_1/overview",
    );
  });
});
