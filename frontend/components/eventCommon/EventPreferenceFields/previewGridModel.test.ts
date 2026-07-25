import { VoteMode } from "@/types/event";
import {
  buildPreviewRows,
  PREVIEW_DAYS,
  PREVIEW_START_MINUTE,
} from "./previewGridModel";

describe("buildPreviewRows", () => {
  it.each([
    [15, 8],
    [30, 4],
    [60, 2],
  ] as const)("splits 2 hours into %i-minute rows", (granularity, rowCount) => {
    const rows = buildPreviewRows(granularity, VoteMode.AVAILABLE);

    expect(rows).toHaveLength(rowCount);
    rows.forEach((row) => expect(row.cells).toHaveLength(PREVIEW_DAYS.length));
  });

  it("exposes every row boundary, so the time column can label them all", () => {
    expect(
      buildPreviewRows(30, VoteMode.AVAILABLE).map((row) => [
        row.startMinute,
        row.endMinute,
      ]),
    ).toEqual([
      [PREVIEW_START_MINUTE, PREVIEW_START_MINUTE + 30],
      [PREVIEW_START_MINUTE + 30, PREVIEW_START_MINUTE + 60],
      [PREVIEW_START_MINUTE + 60, PREVIEW_START_MINUTE + 90],
      [PREVIEW_START_MINUTE + 90, PREVIEW_START_MINUTE + 120],
    ]);
  });

  it("keeps the relative row height in base-slot units", () => {
    expect(buildPreviewRows(15, VoteMode.AVAILABLE).map((row) => row.height)) //
      .toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(
      buildPreviewRows(60, VoteMode.AVAILABLE).map((row) => row.slotIndices),
    ).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ]);
  });

  it("fills the demo availability in available mode", () => {
    // Monday and Thursday 19:00-20:00 exactly, Tuesday 19:30-21:00 and
    // Wednesday 20:00-20:30 straddle the hours the 1-hour view merges.
    expect(
      buildPreviewRows(60, VoteMode.AVAILABLE).map((row) => row.cells),
    ).toEqual([
      ["full", "partial", "none", "full"],
      ["none", "full", "partial", "none"],
    ]);
  });

  it("keeps the demo exact at 15 minutes", () => {
    expect(
      buildPreviewRows(15, VoteMode.AVAILABLE).map((row) => row.cells[1]),
    ).toEqual(["none", "none", "full", "full", "full", "full", "full", "full"]);
    expect(
      buildPreviewRows(15, VoteMode.AVAILABLE).every((row) =>
        row.cells.every((fill) => fill !== "partial"),
      ),
    ).toBe(true);
  });

  it("fills the complement in unavailable mode, describing the same schedule", () => {
    expect(
      buildPreviewRows(60, VoteMode.UNAVAILABLE).map((row) => row.cells),
    ).toEqual([
      ["none", "partial", "full", "none"],
      ["full", "none", "partial", "full"],
    ]);
  });

  it.each([15, 30, 60] as const)(
    "swaps only full and none between the two modes at %i minutes",
    (granularity) => {
      // Same facts, opposite question: what one mode leaves empty the other
      // fills, and a row neither can represent stays partial in both.
      const available = buildPreviewRows(granularity, VoteMode.AVAILABLE);
      const unavailable = buildPreviewRows(granularity, VoteMode.UNAVAILABLE);

      expect(unavailable.map((row) => row.cells)).toEqual(
        available.map((row) =>
          row.cells.map((fill) => {
            if (fill === "partial") return "partial";
            return fill === "full" ? "none" : "full";
          }),
        ),
      );
    },
  );
});
