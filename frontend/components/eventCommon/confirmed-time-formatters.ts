import type { ConfirmedSelection } from "@/types/event";
import {
  formatLocalizedDateTimeRangeLabel,
  formatLocalizedRangeLabel,
} from "./timeRangeFormat";

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

// Validate that a confirmed selection has the required one-time fields.
function isOneTimeConfirmedSelection(
  selection: ConfirmedSelection,
): selection is OneTimeConfirmedSelection {
  return (
    selection.kind === "ONE_TIME_RANGE" &&
    typeof selection.startTime === "string" &&
    typeof selection.endTime === "string"
  );
}

// Validate that a confirmed selection has the required weekday-range fields.
function isWeekdayConfirmedSelection(
  selection: ConfirmedSelection,
): selection is WeekdayConfirmedSelection {
  return (
    selection.kind === "WEEKDAY_RANGE" &&
    Boolean(selection.weekday) &&
    typeof selection.startMinute === "number" &&
    typeof selection.endMinute === "number"
  );
}

// Adapt a one-time confirmed selection to the canonical datetime formatter.
function formatOneTimeConfirmedSelection(
  selection: OneTimeConfirmedSelection,
  locale: string,
) {
  return formatLocalizedDateTimeRangeLabel(
    {
      startTime: selection.startTime,
      endTime: selection.endTime,
    },
    locale,
    { timeZone: "UTC" },
  );
}

// Adapt a recurring confirmed selection to the canonical range formatter.
function formatWeekdayConfirmedSelection(
  selection: WeekdayConfirmedSelection,
  locale: string,
) {
  return formatLocalizedRangeLabel(
    {
      axisType: "WEEKDAY",
      startDate: selection.weekday,
      endDate: selection.weekday,
      startMinute: selection.startMinute,
      endMinute: selection.endMinute,
    },
    locale,
  );
}

// Format any supported confirmed selection into the product's display label.
export function formatConfirmedSelection(
  selection: ConfirmedSelection,
  locale: string,
): string | null {
  if (isOneTimeConfirmedSelection(selection)) {
    return formatOneTimeConfirmedSelection(selection, locale);
  }

  if (!isWeekdayConfirmedSelection(selection)) {
    return null;
  }

  return formatWeekdayConfirmedSelection(selection, locale);
}
