import { describe, expect, it } from "@jest/globals";
import {
  zonedWallClockToInstant,
  instantToZonedWallClock,
  formatDateTimeInZone,
} from "@/lib/time";

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

describe("formatDateTimeInZone", () => {
  // Asserting the same instant in two zones at once pins the output to the
  // requested zone: no single machine time zone can satisfy both.
  it("renders an instant in the requested zone, not the runtime's zone", () => {
    const instant = new Date("2026-07-13T10:00:00Z");

    expect(formatDateTimeInZone(instant, "Asia/Taipei")).toBe(
      "2026/07/13 18:00",
    );
    expect(formatDateTimeInZone(instant, "America/New_York")).toBe(
      "2026/07/13 06:00",
    );
  });

  it("rolls the date over when the target zone is on the previous day", () => {
    const instant = new Date("2026-07-13T02:00:00Z");

    expect(formatDateTimeInZone(instant, "Asia/Taipei")).toBe(
      "2026/07/13 10:00",
    );
    expect(formatDateTimeInZone(instant, "America/New_York")).toBe(
      "2026/07/12 22:00",
    );
  });

  it("reads a naive wall-clock value back with the UTC zone", () => {
    // The digits live in the UTC fields, so "UTC" returns them untouched.
    expect(formatDateTimeInZone(new Date("2026-07-13T18:00:00Z"), "UTC")).toBe(
      "2026/07/13 18:00",
    );
  });

  it("renders midnight as 00:00 rather than 24:00", () => {
    expect(formatDateTimeInZone(new Date("2026-07-13T00:00:00Z"), "UTC")).toBe(
      "2026/07/13 00:00",
    );
  });
});
