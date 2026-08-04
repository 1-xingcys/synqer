import { resolveLegacyEventRedirect } from "@/lib/legacyEventRoutes";

describe("resolveLegacyEventRedirect", () => {
  it("leaves current routes alone", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/events/voting")).toBeNull();
    expect(resolveLegacyEventRedirect("/zh-TW/events/abc/vote")).toBeNull();
    expect(resolveLegacyEventRedirect("/zh-TW/new")).toBeNull();
    expect(resolveLegacyEventRedirect("/")).toBeNull();
  });

  it("does not match a segment that merely starts with a legacy name", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hostedx")).toBeNull();
    expect(resolveLegacyEventRedirect("/zh-TW/joinedevents/abc")).toBeNull();
  });

  it("sends the list roots to the default overview", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hosted")).toBe(
      "/zh-TW/events/voting",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/joined")).toBe(
      "/zh-TW/events/voting",
    );
  });

  it("maps each list tab to the matching overview", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/confirmed")).toBe(
      "/zh-TW/events/confirmed",
    );
    expect(resolveLegacyEventRedirect("/en/joined/voting-ended")).toBe(
      "/en/events/voting-ended",
    );
    expect(resolveLegacyEventRedirect("/en/joined/completed")).toBe(
      "/en/events/completed",
    );
  });

  it("maps each detail tab that still exists", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/joined/evt_1/vote")).toBe(
      "/zh-TW/events/evt_1/vote",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/joined/evt_1/results")).toBe(
      "/zh-TW/events/evt_1/results",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/evt_1/participants")).toBe(
      "/zh-TW/events/evt_1/participants",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/evt_1/settings")).toBe(
      "/zh-TW/events/evt_1/settings",
    );
  });

  it("maps a bare detail path to the overview tab", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/evt_1")).toBe(
      "/zh-TW/events/evt_1/overview",
    );
  });

  it("maps the retired joined status tab to the overview tab", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/joined/evt_1/status")).toBe(
      "/zh-TW/events/evt_1/overview",
    );
  });

  it("falls back to the overview tab instead of 404ing on an unknown tab", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/evt_1/whatever")).toBe(
      "/zh-TW/events/evt_1/overview",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/joined/evt_1/vote/extra")).toBe(
      "/zh-TW/events/evt_1/vote",
    );
  });

  it("keeps paths without a locale prefix unprefixed", () => {
    expect(resolveLegacyEventRedirect("/hosted")).toBe("/events/voting");
    expect(resolveLegacyEventRedirect("/joined/evt_1/vote")).toBe(
      "/events/evt_1/vote",
    );
  });

  it("tolerates a trailing slash", () => {
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/")).toBe(
      "/zh-TW/events/voting",
    );
    expect(resolveLegacyEventRedirect("/zh-TW/hosted/evt_1/")).toBe(
      "/zh-TW/events/evt_1/overview",
    );
  });
});
