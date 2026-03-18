import type { Weekday } from "@/types/event";

const CANONICAL_WEEKDAY_ORDER: Weekday[] = [
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

export function formatWeekdayLabel(
  weekday: Weekday,
  locale: string,
  formatOption: "narrow" | "short" | "long" = "short",
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: formatOption,
    timeZone: "UTC",
  }).format(WEEKDAY_REFERENCE_DATE[weekday]);
}
