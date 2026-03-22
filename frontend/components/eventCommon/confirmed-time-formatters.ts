import type { ConfirmedSelection } from "@/types/event";
import {
  formatLocalizedConfirmedAxisTimeRangeLabel,
  formatLocalizedConfirmedDateTimeRangeLabel,
} from "./timeRangeFormat";

type OneTimeConfirmedSelection = ConfirmedSelection & {
  kind: "ONE_TIME_RANGE";
  startTime: string;
  endTime: string;
};

type WeekdayConfirmedSelection = ConfirmedSelection & {
  kind: "WEEKDAY_RANGE";
  weekday: NonNullable<ConfirmedSelection["weekday"]>;
  startMinute: number;
  endMinute: number;
};

function isOneTimeConfirmedSelection(
  selection: ConfirmedSelection,
): selection is OneTimeConfirmedSelection {
  return (
    selection.kind === "ONE_TIME_RANGE" &&
    typeof selection.startTime === "string" &&
    typeof selection.endTime === "string"
  );
}

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

function formatOneTimeConfirmedSelection(
  selection: OneTimeConfirmedSelection,
  locale: string,
) {
  return formatLocalizedConfirmedDateTimeRangeLabel(
    {
      startTime: selection.startTime,
      endTime: selection.endTime,
    },
    locale,
    { timeZone: "UTC" },
  );
}

function formatWeekdayConfirmedSelection(
  selection: WeekdayConfirmedSelection,
  locale: string,
) {
  return formatLocalizedConfirmedAxisTimeRangeLabel(
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
