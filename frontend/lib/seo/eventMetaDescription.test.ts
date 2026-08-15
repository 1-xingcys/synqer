import { describe, expect, it } from "@jest/globals";
import {
  formatEventMetaDescription,
  type EventMetaDescriptionInput,
  type EventMetaDescriptionLabels,
} from "@/lib/seo/eventMetaDescription";
import { calendarDay, wallClock } from "@/lib/time";

const LABELS: EventMetaDescriptionLabels = {
  candidateDates: "候選日期",
  candidateWeekdays: "候選星期",
  candidateTime: "候選時段",
  votingDeadline: "投票截止時間",
  noDeadline: "未設定截止時間",
};

const oneTime: EventMetaDescriptionInput = {
  type: "ONE_TIME",
  schedule: {
    kind: "ONE_TIME",
    startDate: calendarDay("2026-07-30"),
    endDate: calendarDay("2026-08-02"),
    startMinuteOfDay: 540,
    endMinuteOfDay: 1080,
    slotDurationMin: 30,
  },
  timeZone: "Asia/Taipei",
  votingDeadline: wallClock("2026-07-28T23:59:00.000Z"),
};

const recurring: EventMetaDescriptionInput = {
  type: "RECURRING",
  schedule: {
    kind: "RECURRING",
    weekdays: ["MONDAY", "WEDNESDAY"],
    startMinuteOfDay: 1140,
    endMinuteOfDay: 1320,
    slotDurationMin: 30,
  },
  timeZone: "Asia/Taipei",
  votingDeadline: null,
};

describe("formatEventMetaDescription", () => {
  it("reads a dated event as its days, its daily window and its deadline", () => {
    expect(formatEventMetaDescription(oneTime, "zh-TW", LABELS)).toBe(
      "候選日期 2026/07/30 ~ 2026/08/02 · 候選時段 09:00 ~ 18:00 (Asia/Taipei) · 投票截止時間 2026/07/28 23:59",
    );
  });

  it("names the weekdays of a recurring event rather than dates", () => {
    expect(formatEventMetaDescription(recurring, "zh-TW", LABELS)).toContain(
      "候選星期 週一, 週三",
    );
  });

  it("says so when there is no deadline rather than leaving the label bare", () => {
    expect(formatEventMetaDescription(recurring, "zh-TW", LABELS)).toContain(
      "投票截止時間 未設定截止時間",
    );
  });

  // The daily window is a wall clock belonging to the event. Without the zone
  // it reads as the viewer's own, which is exactly what it is not.
  it("attaches the time zone to the daily window", () => {
    expect(formatEventMetaDescription(recurring, "en", LABELS)).toContain(
      "19:00 ~ 22:00 (Asia/Taipei)",
    );
  });

  it("names the weekdays in the locale it is given", () => {
    expect(formatEventMetaDescription(recurring, "en", LABELS)).toContain(
      "Mon, Wed",
    );
  });

  // The deadline is a naive timestamp whose digits sit in the UTC fields.
  // Formatting it in the runner's zone would shift it, and near midnight would
  // roll the day.
  it("reports the deadline digits as stored, whatever zone the reader is in", () => {
    const nearMidnight = {
      ...oneTime,
      votingDeadline: wallClock("2026-07-28T00:30:00.000Z"),
    };

    expect(formatEventMetaDescription(nearMidnight, "zh-TW", LABELS)).toContain(
      "2026/07/28 00:30",
    );
  });

  it("drops the day field rather than dangle its label over nothing", () => {
    const noWeekdays: EventMetaDescriptionInput = {
      ...recurring,
      schedule: { ...recurring.schedule, kind: "RECURRING", weekdays: [] },
    };

    const description = formatEventMetaDescription(noWeekdays, "zh-TW", LABELS);

    expect(description).not.toContain("候選星期");
    expect(description.startsWith("候選時段")).toBe(true);
  });
});
