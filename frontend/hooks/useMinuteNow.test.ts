import { describe, expect, it } from "@jest/globals";
import { getDelayUntilNextMinute } from "@/hooks/useMinuteNow";

describe("useMinuteNow", () => {
  it("returns one full minute when already aligned to a minute boundary", () => {
    expect(getDelayUntilNextMinute(new Date("2026-04-10T09:30:00.000Z"))).toBe(
      60_000,
    );
  });

  it("returns the remaining milliseconds until the next minute boundary", () => {
    expect(getDelayUntilNextMinute(new Date("2026-04-10T09:30:15.250Z"))).toBe(
      44_750,
    );
  });
});
