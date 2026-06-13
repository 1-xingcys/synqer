import { describe, expect, it } from "@jest/globals";
import { buildHostedEventResultTextFromSummary } from "@/components/hostedEvent/hostedEventResultText";

describe("hostedEventResultText", () => {
  it("formats recurring confirmed ranges with the shared confirmed format", () => {
    const result = buildHostedEventResultTextFromSummary({
      eventTitle: "Team Sync",
      timeZone: "UTC",
      locale: "en-US",
      copy: {
        title: "Confirmed result",
        eventLine: (eventTitle) => `Event: ${eventTitle}`,
        availableLine: (availableCount, totalExpected) =>
          `Available: ${availableCount}/${totalExpected}`,
        unavailableLine: (names) => `Unavailable: ${names}`,
        none: "None",
      },
      summary: {
        totalExpected: 3,
        ranges: [
          {
            axisType: "WEEKDAY",
            startDate: "MONDAY",
            endDate: "MONDAY",
            startMinute: 600,
            endMinute: 720,
            availableCount: 2,
            unavailableParticipants: [{ name: "Alex" }],
          },
        ],
      },
    });

    expect(result).toContain("1. (Mon) 10:00 - 12:00");
  });

  it("formats one-time confirmed ranges in the event time zone", () => {
    const result = buildHostedEventResultTextFromSummary({
      eventTitle: "Weekend Plan",
      timeZone: "Asia/Taipei",
      locale: "zh-TW",
      copy: {
        title: "已確認結果",
        eventLine: (eventTitle) => `活動：${eventTitle}`,
        availableLine: (availableCount, totalExpected) =>
          `可出席：${availableCount}/${totalExpected}`,
        unavailableLine: (names) => `不能出席：${names}`,
        none: "無",
      },
      summary: {
        totalExpected: 1,
        ranges: [
          {
            axisType: "DATE",
            startDate: "2026-06-13T00:00:00+08:00",
            endDate: "2026-06-14T00:00:00+08:00",
            startMinute: 1230,
            endMinute: 1410,
            availableCount: 1,
            unavailableParticipants: [],
          },
        ],
      },
    });

    expect(result).toContain("1. 6/13（六） - 6/14（日） 20:30 - 23:30");
  });
});
