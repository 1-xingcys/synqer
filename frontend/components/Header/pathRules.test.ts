import { describe, expect, it } from "@jest/globals";
import { isEventDetailPagePath } from "./pathRules";

describe("Header path rules", () => {
  it("returns true for hosted detail routes", () => {
    expect(isEventDetailPagePath("/hosted/event-123")).toBe(true);
    expect(isEventDetailPagePath("/hosted/event-123/participants")).toBe(true);
    expect(isEventDetailPagePath("/hosted/event-123/settings")).toBe(true);
  });

  it("returns true for joined detail routes", () => {
    expect(isEventDetailPagePath("/joined/event-123")).toBe(true);
    expect(isEventDetailPagePath("/joined/event-123/participants")).toBe(true);
    expect(isEventDetailPagePath("/joined/event-123/results")).toBe(true);
  });

  it("returns false for hosted and joined overview/list routes", () => {
    expect(isEventDetailPagePath("/hosted")).toBe(false);
    expect(isEventDetailPagePath("/hosted/voting")).toBe(false);
    expect(isEventDetailPagePath("/hosted/completed")).toBe(false);
    expect(isEventDetailPagePath("/joined")).toBe(false);
    expect(isEventDetailPagePath("/joined/info")).toBe(false);
    expect(isEventDetailPagePath("/joined/voting-ended")).toBe(false);
    expect(isEventDetailPagePath("/joined/info/event-123")).toBe(false);
  });
});
