import type { Weekday } from "@/types/event";

export const CANONICAL_WEEKDAY_ORDER: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const WEEKDAY_REFERENCE_DATE: Record<Weekday, Date> = {
  MONDAY: new Date("2024-01-01T12:00:00.000Z"),
  TUESDAY: new Date("2024-01-02T12:00:00.000Z"),
  WEDNESDAY: new Date("2024-01-03T12:00:00.000Z"),
  THURSDAY: new Date("2024-01-04T12:00:00.000Z"),
  FRIDAY: new Date("2024-01-05T12:00:00.000Z"),
  SATURDAY: new Date("2024-01-06T12:00:00.000Z"),
  SUNDAY: new Date("2024-01-07T12:00:00.000Z"),
};

type LocaleWithWeekInfo = Intl.Locale & {
  weekInfo?: {
    firstDay?: number;
  };
};

function getLocaleFirstDay(locale: string): number {
  try {
    const localeInfo = new Intl.Locale(locale) as LocaleWithWeekInfo;
    return localeInfo.weekInfo?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

function normalizeFirstDay(firstDay: number): Weekday {
  const weekdayFromIntl = firstDay === 7 ? 0 : firstDay;
  const orderedFromSunday: Weekday[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return orderedFromSunday[weekdayFromIntl] ?? "MONDAY";
}

export function getOrderedWeekdays(locale: string): Weekday[] {
  const firstDay = normalizeFirstDay(getLocaleFirstDay(locale));
  const startIndex = CANONICAL_WEEKDAY_ORDER.indexOf(firstDay);

  if (startIndex === -1) {
    return CANONICAL_WEEKDAY_ORDER;
  }

  return [
    ...CANONICAL_WEEKDAY_ORDER.slice(startIndex),
    ...CANONICAL_WEEKDAY_ORDER.slice(0, startIndex),
  ];
}

function formatWeekdayTextFromDate(
  date: Date,
  locale: string,
  formatOption: "narrow" | "short" | "long" = "short",
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: formatOption,
    timeZone,
  }).format(date);
}

export function formatWeekdayLabel(
  weekday: Weekday,
  locale: string,
  formatOption: "narrow" | "short" | "long" = "short",
): string {
  // Weekday enums such as MONDAY/SATURDAY are semantic labels rather than
  // wall-clock instants, so keep them pinned to UTC to avoid locale/environment
  // time zones shifting the intended weekday.
  return formatWeekdayTextFromDate(
    WEEKDAY_REFERENCE_DATE[weekday],
    locale,
    formatOption,
    "UTC",
  );
}

export function formatWeekdayLabelFromDate(
  date: Date,
  locale: string,
  formatOption: "narrow" | "short" | "long" = "short",
  timeZone?: string,
): string {
  // Concrete dates should follow the caller's time zone so the weekday stays
  // aligned with the formatted month/day shown beside it.
  return formatWeekdayTextFromDate(date, locale, formatOption, timeZone);
}
