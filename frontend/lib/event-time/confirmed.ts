import type { ConfirmedSelection } from "@/types/event";
// Intra-module import stays relative: see lib/time/calendarDay.ts.
import {
  formatLocalizedDateTimeRangeLabel,
  formatLocalizedRangeLabel,
} from "./rangeLabel";

/**
 * Narrow a confirmed selection to the one-time shape used by one-off events.
 *
 * The times are read off `ConfirmedSelection` rather than restated as `string`
 * so they stay WallClock: writing `string` here would have been dead text the
 * intersection discards, but it read as though these were unbranded.
 */
export type OneTimeConfirmedSelection = ConfirmedSelection & {
  kind: "ONE_TIME_RANGE";
  startTime: NonNullable<ConfirmedSelection["startTime"]>;
  endTime: NonNullable<ConfirmedSelection["endTime"]>;
};

// Narrow a confirmed selection to the weekday-based shape used by recurring events.
type WeekdayConfirmedSelection = ConfirmedSelection & {
  kind: "WEEKDAY_RANGE";
  weekday: NonNullable<ConfirmedSelection["weekday"]>;
  startMinute: number;
  endMinute: number;
};

export function isOneTimeConfirmedSelection(
  selection: ConfirmedSelection,
): selection is OneTimeConfirmedSelection {
  return (
    selection.kind === "ONE_TIME_RANGE" &&
    selection.startTime !== undefined &&
    selection.endTime !== undefined
  );
}

function isWeekdayConfirmedSelection(
  selection: ConfirmedSelection,
): selection is WeekdayConfirmedSelection {
  return (
    selection.kind === "WEEKDAY_RANGE" &&
    selection.weekday !== undefined &&
    selection.startMinute !== undefined &&
    selection.endMinute !== undefined
  );
}

/**
 * A confirmed selection as the product's display label, or null when it carries
 * neither kind's fields — a shape only malformed data reaches.
 */
export function formatConfirmedSelection(
  selection: ConfirmedSelection,
  locale: string,
): string | null {
  if (isOneTimeConfirmedSelection(selection)) {
    return formatLocalizedDateTimeRangeLabel(
      { startTime: selection.startTime, endTime: selection.endTime },
      locale,
    );
  }

  if (isWeekdayConfirmedSelection(selection)) {
    return formatLocalizedRangeLabel(
      {
        axisType: "WEEKDAY",
        weekday: selection.weekday,
        startMinute: selection.startMinute,
        endMinute: selection.endMinute,
      },
      locale,
    );
  }

  return null;
}
