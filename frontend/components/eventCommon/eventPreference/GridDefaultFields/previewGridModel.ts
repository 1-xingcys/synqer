import type { MergedTimeRow } from "@/components/eventCommon/timeGrid/types";
import { VoteMode, type TimeGranularity, type Weekday } from "@/types/event";

/**
 * The static demo data behind the preference preview.
 *
 * The preview is a fixed 4 days x 2 hours window built on the same 15-minute
 * base slots the real grid uses, so switching granularity re-splits the window
 * exactly the way the voting grid does.
 */

export const PREVIEW_DAYS: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
];

/** 14:00-16:00, as eight 15-minute base slots. */
export const PREVIEW_START_MINUTE = 14 * 60;
export const PREVIEW_BASE_SLOT_COUNT = 8;
const BASE_SLOT_MINUTES = 15;

/**
 * When each demo day is available, as base-slot indices: Monday and Thursday
 * 14:00-15:00, Tuesday 14:30-16:00, Wednesday 15:00-15:30.
 *
 * The schedule is stated once as availability, so the two vote modes describe
 * the same facts — the unavailable mode paints the complement. Tuesday and
 * Wednesday sit on half-hour boundaries, so the 1-hour view has to blur them
 * into partial cells, exactly like the voting grid.
 */
const DEMO_AVAILABLE_SLOTS: number[][] = [
  [0, 1, 2, 3],
  [2, 3, 4, 5, 6, 7],
  [4, 5],
  [0, 1, 2, 3],
];

export type PreviewCellFill = "none" | "partial" | "full";

/** A merged row of the real grid, plus the demo vote of each preview day. */
export interface PreviewRow extends MergedTimeRow {
  cells: PreviewCellFill[];
}

/**
 * How much of a row the demo vote covers: the mode's meaning has to hold for
 * every base slot to fill the cell — available slots in available mode, the
 * rest in unavailable mode — and a row it only partly covers reads as partial,
 * since a coarser view cannot represent it exactly.
 */
function resolveFill(
  availableSlots: number[],
  voteMode: VoteMode,
  rowStartIndex: number,
  slotsPerRow: number,
): PreviewCellFill {
  const votesAvailability = voteMode === VoteMode.AVAILABLE;
  let votedCount = 0;

  for (let offset = 0; offset < slotsPerRow; offset += 1) {
    if (availableSlots.includes(rowStartIndex + offset) === votesAvailability) {
      votedCount += 1;
    }
  }

  if (votedCount === 0) return "none";
  return votedCount === slotsPerRow ? "full" : "partial";
}

export function buildPreviewRows(
  granularity: TimeGranularity,
  voteMode: VoteMode,
): PreviewRow[] {
  const slotsPerRow = granularity / BASE_SLOT_MINUTES;
  const rowCount = PREVIEW_BASE_SLOT_COUNT / slotsPerRow;

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const rowStartIndex = rowIndex * slotsPerRow;
    const startMinute =
      PREVIEW_START_MINUTE + rowStartIndex * BASE_SLOT_MINUTES;

    return {
      startMinute,
      endMinute: startMinute + granularity,
      slotIndices: Array.from(
        { length: slotsPerRow },
        (_unused, offset) => rowStartIndex + offset,
      ),
      height: slotsPerRow,
      cells: DEMO_AVAILABLE_SLOTS.map((availableSlots) =>
        resolveFill(availableSlots, voteMode, rowStartIndex, slotsPerRow),
      ),
    };
  });
}
