import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { buildEventShareFlexMessage } from "@/lib/line-flex-message/shareEventFlexMessage";
import { wallClock } from "@/lib/time";

type FlexTextNode = {
  type?: string;
  text?: string;
};

describe("shareEventFlexMessage", () => {
  const originalLiffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_LINE_LIFF_ID = "test-liff-id";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_LINE_LIFF_ID = originalLiffId;
  });

  it("renders the naive votingDeadline's wall-clock digits, not double-shifted through the event zone", () => {
    // votingDeadline is stored naive: UTC fields carry the wall-clock digits
    // for the event's time zone. "2026-07-13T18:00:00Z" means wall-clock
    // 18:00 in Asia/Taipei — NOT 18:00 UTC converted again into Taipei time
    // (which would double-apply the +8 offset and roll over to 02:00 the
    // next day).
    const message = buildEventShareFlexMessage({
      eventId: "event-1",
      title: "Team Sync",
      hostName: "Alex",
      votingDeadline: wallClock("2026-07-13T18:00:00Z"),
      timeZone: "Asia/Taipei",
    });

    const bodyContents = (
      message.contents as { body: { contents: FlexTextNode[] } }
    ).body.contents;
    const deadlineNode = bodyContents.find((node) =>
      node.text?.includes("18:00"),
    );

    expect(deadlineNode?.text).toContain("18:00");
    // Guard against the double-offset regression: the buggy version renders
    // "02:00" (18:00 + 8h wrapped) instead of the correct "18:00".
    expect(deadlineNode?.text).not.toContain("02:00");
  });
});
