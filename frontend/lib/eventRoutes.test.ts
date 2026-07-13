import {
  eventOverviewPath,
  eventDetailPath,
  legacyOverviewRedirect,
  legacyDetailRedirect,
} from "./eventRoutes";

describe("eventRoutes", () => {
  it("builds overview paths", () => {
    expect(eventOverviewPath("voting")).toBe("/events/voting");
    expect(eventOverviewPath("voting-ended")).toBe("/events/voting-ended");
  });

  it("builds detail paths with optional tab", () => {
    expect(eventDetailPath("abc")).toBe("/events/abc/overview");
    expect(eventDetailPath("abc", "results")).toBe("/events/abc/results");
  });
});

describe("legacy redirects", () => {
  it("maps a legacy overview status to the unified overview path", () => {
    expect(legacyOverviewRedirect("confirmed")).toBe("/events/confirmed");
  });

  it("falls back to the default overview when no status is given", () => {
    expect(legacyOverviewRedirect()).toBe("/events/voting");
  });

  it("maps a legacy detail tab to the unified detail path", () => {
    expect(legacyDetailRedirect("evt_1", "vote")).toBe("/events/evt_1/vote");
  });

  it("maps a legacy detail root to the unified overview page", () => {
    expect(legacyDetailRedirect("evt_1")).toBe("/events/evt_1/overview");
  });
});
