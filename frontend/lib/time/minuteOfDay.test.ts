import { describe, expect, it } from "@jest/globals";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";

describe("formatMinutesToTime", () => {
  it("pads to HH:mm", () => {
    expect(formatMinutesToTime(0)).toBe("00:00");
    expect(formatMinutesToTime(570)).toBe("09:30");
    expect(formatMinutesToTime(1439)).toBe("23:59");
  });

  // Slot end boundaries are expressed as 1440 rather than rolling to 00:00.
  it("renders the end-of-day boundary as 24:00", () => {
    expect(formatMinutesToTime(1440)).toBe("24:00");
  });
});
