import { describe, expect, it } from "@jest/globals";
import { getOneTimeEventStartInstant } from "@/lib/eventSchedule";

describe("eventSchedule", () => {
  it("matches the backend's UTC-based one-time event start calculation", () => {
    const result = getOneTimeEventStartInstant({
      kind: "ONE_TIME",
      startDate: "2026-04-10T00:00:00.000Z",
      endDate: "2026-04-10T00:00:00.000Z",
      startMinuteOfDay: 540,
      endMinuteOfDay: 600,
      slotDurationMin: 15,
    });

    expect(result.toISOString()).toBe("2026-04-10T09:00:00.000Z");
  });
});
