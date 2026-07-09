import {
  eventOverviewPath,
  eventDetailPath,
  legacyOverviewRedirect,
  legacyDetailRedirect,
} from "./eventRoutes";

describe("eventRoutes", () => {
  it("builds overview paths", () => {
    expect(eventOverviewPath("voting")).toBe("/e/voting");
    expect(eventOverviewPath("voting-ended")).toBe("/e/voting-ended");
  });

  it("builds detail paths with optional tab", () => {
    expect(eventDetailPath("abc")).toBe("/e/abc");
    expect(eventDetailPath("abc", "results")).toBe("/e/abc/results");
  });
});

describe("legacy redirects", () => {
  it("maps a legacy overview status to the unified overview path", () => {
    expect(legacyOverviewRedirect("confirmed")).toBe("/e/confirmed");
  });

  it("falls back to the default overview when no status is given", () => {
    expect(legacyOverviewRedirect()).toBe("/e/voting");
  });

  it("maps a legacy detail tab to the unified detail path", () => {
    expect(legacyDetailRedirect("evt_1", "vote")).toBe("/e/evt_1/vote");
  });

  it("maps a legacy detail root to the unified detail root", () => {
    expect(legacyDetailRedirect("evt_1")).toBe("/e/evt_1");
  });
});
