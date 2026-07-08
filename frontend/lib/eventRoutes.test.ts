import { eventOverviewPath, eventDetailPath } from "./eventRoutes";

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
