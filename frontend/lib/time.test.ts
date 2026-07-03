import { describe, expect, it } from "@jest/globals";
import { zonedWallClockToInstant, instantToZonedWallClock } from "@/lib/time";

describe("frontend time util", () => {
  it("resolves Asia/Taipei wall-clock 18:00 to 10:00Z", () => {
    const wall = new Date("2026-07-13T18:00:00Z");
    expect(zonedWallClockToInstant(wall, "Asia/Taipei").toISOString()).toBe(
      "2026-07-13T10:00:00.000Z",
    );
  });

  it("round-trips instant -> wall-clock", () => {
    const instant = new Date("2026-07-13T10:00:00Z");
    const wall = instantToZonedWallClock(instant, "Asia/Taipei");
    expect(wall.toISOString()).toBe("2026-07-13T18:00:00.000Z");
  });
});
