import { describe, expect, it } from "@jest/globals";
import { buildHostedEventResultTextFromSummary } from "./hostedEventResultText";
import { calendarDay } from "@/lib/time";

describe("hostedEventResultText", () => {
  it("formats recurring confirmed ranges with the shared confirmed format", () => {
    const result = buildHostedEventResultTextFromSummary({
      eventTitle: "Team Sync",
      locale: "en-US",
      copy: {
        title: "Confirmed result",
        eventLine: (eventTitle) => `Event: ${eventTitle}`,
        availableLine: (availableCount, totalExpected) =>
          `Available: ${availableCount}/${totalExpected}`,
        unavailableLine: (names) => `Unavailable: ${names}`,
        notVotedLine: (names) => `Not voted: ${names}`,
        none: "None",
      },
      summary: {
        totalExpected: 3,
        ranges: [
          {
            axis: { axisType: "WEEKDAY", weekday: "MONDAY" },
            startMinute: 600,
            endMinute: 720,
            availableCount: 2,
            unavailableParticipants: [{ name: "Alex" }],
          },
        ],
        notVotedParticipants: [],
      },
    });

    expect(result).toContain("1. (Mon) 10:00 - 12:00");
  });

  // Candidate days are naive, so the label reads the stored digits rather than
  // re-projecting them through the event zone.
  it("formats one-time confirmed ranges on their stored calendar days", () => {
    const result = buildHostedEventResultTextFromSummary({
      eventTitle: "Weekend Plan",
      locale: "zh-TW",
      copy: {
        title: "已確認結果",
        eventLine: (eventTitle) => `活動：${eventTitle}`,
        availableLine: (availableCount, totalExpected) =>
          `可出席：${availableCount}/${totalExpected}`,
        unavailableLine: (names) => `不能出席：${names}`,
        notVotedLine: (names) => `Not voted: ${names}`,
        none: "無",
      },
      summary: {
        totalExpected: 1,
        ranges: [
          {
            axis: {
              axisType: "DATE",
              startDay: calendarDay("2026-06-13"),
              endDay: calendarDay("2026-06-14"),
            },
            startMinute: 1230,
            endMinute: 1410,
            availableCount: 1,
            unavailableParticipants: [],
          },
        ],
        notVotedParticipants: [],
      },
    });

    expect(result).toContain("1. 6/13（六） - 6/14（日） 20:30 - 23:30");
  });

  it("adds one not-voted line at the end, however many ranges there are", () => {
    const build = (notVotedParticipants: { name: string }[]) =>
      buildHostedEventResultTextFromSummary({
        eventTitle: "Team Sync",
        locale: "en-US",
        copy: {
          title: "Confirmed result",
          eventLine: (eventTitle) => `Event: ${eventTitle}`,
          availableLine: (availableCount, totalExpected) =>
            `Available: ${availableCount}/${totalExpected}`,
          unavailableLine: (names) => `Unavailable: ${names}`,
          notVotedLine: (names) => `Not voted: ${names}`,
          none: "None",
        },
        summary: {
          totalExpected: 3,
          ranges: [
            {
              axis: { axisType: "WEEKDAY", weekday: "MONDAY" },
              startMinute: 600,
              endMinute: 720,
              availableCount: 1,
              unavailableParticipants: [{ name: "Ben" }],
            },
            {
              axis: { axisType: "WEEKDAY", weekday: "TUESDAY" },
              startMinute: 600,
              endMinute: 720,
              availableCount: 1,
              unavailableParticipants: [{ name: "Ben" }],
            },
          ],
          notVotedParticipants,
        },
      });

    const withNotVoted = build([{ name: "Cat" }]);
    expect(withNotVoted.match(/Not voted/g)).toHaveLength(1);
    expect(withNotVoted.endsWith("Not voted: Cat")).toBe(true);
    expect(build([])).not.toContain("Not voted");
  });
});
