import { describe, expect, it } from "@jest/globals";
import {
  EventStatus,
  EventWithCapabilities,
  ConfirmedTimeRange,
  EventSchedule,
} from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventScheduleSummary,
  getEventSortTime,
} from "@/lib/event-presentation";

type EventFixture = EventWithCapabilities & {
  startDate: string;
  endDate: string;
  votingDeadline?: string | null;
  confirmedTimeRanges?: ConfirmedTimeRange[];
  schedule?: EventSchedule;
};

const recurringEvent: EventFixture = {
  startDate: "2025-01-15T12:00:00.000Z",
  endDate: "2025-01-15T12:00:00.000Z",
  votingDeadline: "2025-01-20T12:00:00.000Z",
  capabilities: {
    supportsCompletion: false,
    supportsCalendarConflict: false,
    supportsAddToCalendar: false,
  },
  schedule: {
    kind: "RECURRING",
    weekdays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
    startMinuteOfDay: 540,
    endMinuteOfDay: 660,
    slotDurationMin: 30,
  },
};

describe("event-presentation", () => {
  it("formats recurring schedule summary with weekday labels and time range", () => {
    expect(formatEventScheduleSummary(recurringEvent, "en-US")).toBe(
      "Mon, Wed, Fri • 09:00 ~ 11:00",
    );
  });

  it("formats weekday axis keys for recurring grids", () => {
    expect(formatAxisKeyLabel("WEDNESDAY", "WEEKDAY", "en-US")).toBe("Wed");
  });

  it("sorts voting-ended recurring events by createdAt fallback", () => {
    const now = new Date("2025-02-01T00:00:00.000Z").getTime();

    expect(
      getEventSortTime(recurringEvent, EventStatus.VOTING_ENDED, now),
    ).toBe(Math.abs(new Date("2025-01-15T12:00:00.000Z").getTime() - now));
  });
});
