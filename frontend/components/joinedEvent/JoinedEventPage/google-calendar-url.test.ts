import { describe, expect, it } from "@jest/globals";
import {
  formatGoogleCalendarDate,
  generateGoogleCalendarUrl,
} from "@/components/joinedEvent/JoinedEventPage/google-calendar-url";

describe("formatGoogleCalendarDate", () => {
  it("resolves a naive wall-clock value to the real UTC instant and appends Z", () => {
    // Naive wall-clock: "09:00" digits stored as UTC, meaning 09:00 in Asia/Tokyo.
    const result = formatGoogleCalendarDate(
      "2026-07-13T09:00:00.000Z",
      "Asia/Tokyo",
    );

    // 09:00 Tokyo (UTC+9) === 00:00 UTC on the same day.
    expect(result).toBe("20260713T000000Z");
    // Must NOT be the old naive/no-resolve/no-Z output.
    expect(result).not.toBe("20260713T090000");
  });
});

describe("generateGoogleCalendarUrl", () => {
  it("builds a dates param using resolved, Z-suffixed instants", () => {
    const url = generateGoogleCalendarUrl(
      "Team Sync",
      undefined,
      "2026-07-13T09:00:00.000Z",
      "2026-07-13T10:00:00.000Z",
      "Asia/Tokyo",
    );

    const parsed = new URL(url);
    expect(parsed.searchParams.get("dates")).toBe(
      "20260713T000000Z/20260713T010000Z",
    );
  });
});
