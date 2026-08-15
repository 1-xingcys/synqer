import { eventOverviewPath, eventDetailPath } from "./eventRoutes";

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
