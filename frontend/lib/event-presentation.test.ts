import { describe, expect, it } from "@jest/globals";
import {
  EventStatus,
  EventWithCapabilities,
  ConfirmedTimeRange,
  EventSchedule,
} from "@/types/event";
import {
  formatAxisKeyLabel,
  formatEventCandidateDaySummary,
  formatEventScheduleSummary,
  getEventSortTime,
} from "@/lib/event-presentation";

type EventFixture = EventWithCapabilities & {
  startDate: string;
  endDate: string;
  votingDeadline?: string | null;
  confirmedTimeRanges?: ConfirmedTimeRange[];
  schedule?: EventSchedule;
  confirmedSelections?: import("@/types/event").ConfirmedSelection[];
};

const recurringEvent: EventFixture = {
  type: "RECURRING",
  weekdays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
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

  it("formats recurring candidate day summary without time range", () => {
    expect(formatEventCandidateDaySummary(recurringEvent, "en-US")).toBe(
      "Mon, Wed, Fri",
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

  it("prefers confirmed selections over legacy confirmed time ranges for start/end time", () => {
    const oneTimeConfirmedEvent: EventFixture = {
      ...recurringEvent,
      type: "ONE_TIME",
      confirmedSelections: [
        {
          kind: "ONE_TIME_RANGE",
          startTime: "2025-03-01T09:00:00.000Z",
          endTime: "2025-03-01T10:00:00.000Z",
          slotIds: ["slot-1"],
        },
      ],
      confirmedTimeRanges: [
        {
          startTime: "2025-03-05T09:00:00.000Z",
          endTime: "2025-03-05T10:00:00.000Z",
          slotIds: ["slot-2"],
        },
      ],
    };

    expect(
      getEventSortTime(
        oneTimeConfirmedEvent,
        EventStatus.CONFIRMED,
        new Date("2025-03-10T00:00:00.000Z").getTime(),
      ),
    ).toBe(
      Math.abs(
        new Date("2025-03-01T09:00:00.000Z").getTime() -
          new Date("2025-03-10T00:00:00.000Z").getTime(),
      ),
    );
  });
});
