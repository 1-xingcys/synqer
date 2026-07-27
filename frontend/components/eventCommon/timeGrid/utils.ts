import { formatWeekdayLabel, getOrderedWeekdays } from "@/lib/weekdays";
import { parseCalendarDayValue } from "@/lib/time";
import type { CalendarDay } from "@/lib/time";
import { calendarDayMinuteToInstant } from "@/lib/time";
import { axisDateToCalendarDay } from "@/lib/time";
import { axisSpanKey, axisSpanOfSlot } from "@/lib/axisSpan";
import { TimeSlot, Vote, CalendarEvent, GridAxisColumn } from "./types";

function warnInvalidSlot(slot: TimeSlot, reason: string) {
  console.warn(`[timeGrid] Skip invalid slot ${slot.id}: ${reason}`);
}

// Map app locale to an Intl locale string
const getDateLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    "zh-TW": "zh-TW",
    en: "en-US",
  };
  return localeMap[locale] || locale;
};

export const formatAxisHeader = (
  column: GridAxisColumn,
  locale: string = "en",
): { weekday: string; day?: number; month?: string } => {
  if (column.axis.axisType === "WEEKDAY") {
    return {
      weekday: formatWeekdayLabel(column.axis.weekday, locale),
    };
  }

  const date = parseCalendarDayValue(column.axis.startDay);
  const dateLocale = getDateLocale(locale);
  const weekday = date.toLocaleDateString(dateLocale, { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString(dateLocale, { month: "short" });
  return { weekday, day, month };
};

export const formatAxisPageRange = (
  startColumn: GridAxisColumn | undefined,
  endColumn: GridAxisColumn | undefined,
  locale: string,
): string => {
  if (!startColumn || !endColumn) return "";

  // A grid is never mixed-kind, and the union now says so: the start column
  // alone decides which formatter both ends go through. Testing both columns
  // was the weaker guard — it silently fell into the date branch on a mismatch.
  if (startColumn.axis.axisType === "WEEKDAY") {
    if (endColumn.axis.axisType !== "WEEKDAY") return "";

    const startLabel = formatWeekdayLabel(startColumn.axis.weekday, locale);
    const endLabel = formatWeekdayLabel(endColumn.axis.weekday, locale);
    return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
  }

  if (endColumn.axis.axisType !== "DATE") return "";

  const startLabel = formatDatePageValue(startColumn.axis.startDay);
  const endLabel = formatDatePageValue(endColumn.axis.startDay);
  return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
};

const formatDatePageValue = (day: CalendarDay): string => {
  const date = parseCalendarDayValue(day);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export const buildAxisColumns = (
  axisKeys: string[],
  slotsByAxis: Record<string, TimeSlot[]>,
): GridAxisColumn[] => {
  return axisKeys.flatMap((axisKey) => {
    const firstSlot = slotsByAxis[axisKey]?.[0];
    const axis = firstSlot && axisSpanOfSlot(firstSlot);

    return axis ? [{ key: axisKey, axis }] : [];
  });
};

export const sortAxisKeys = (
  axisKeys: string[],
  slotsByAxis: Record<string, TimeSlot[]>,
  locale: string,
): string[] => {
  return [...axisKeys].sort((left, right) => {
    const leftSlot = slotsByAxis[left]?.[0];
    const rightSlot = slotsByAxis[right]?.[0];

    if (
      leftSlot?.axisType === "WEEKDAY" &&
      rightSlot?.axisType === "WEEKDAY" &&
      leftSlot.axisWeekday &&
      rightSlot.axisWeekday
    ) {
      const orderedWeekdays = getOrderedWeekdays(locale);
      return (
        orderedWeekdays.indexOf(leftSlot.axisWeekday) -
        orderedWeekdays.indexOf(rightSlot.axisWeekday)
      );
    }

    return left.localeCompare(right);
  });
};

// Group slots by axis key
export const groupSlotsByAxis = (
  slots: TimeSlot[],
): Record<string, TimeSlot[]> => {
  return slots.reduce(
    (acc, slot) => {
      const span = axisSpanOfSlot(slot);
      if (!span) {
        warnInvalidSlot(slot, "missing axisDate");
        return acc;
      }

      const axisKey = axisSpanKey(span);
      if (!acc[axisKey]) acc[axisKey] = [];
      acc[axisKey].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>,
  );
};

// Group votes by slot
export const groupVotesBySlot = (votes: Vote[]): Record<string, Vote[]> => {
  return votes.reduce(
    (acc, vote) => {
      if (!acc[vote.slotId]) acc[vote.slotId] = [];
      acc[vote.slotId].push(vote);
      return acc;
    },
    {} as Record<string, Vote[]>,
  );
};

// Map calendar events to slots
export const mapCalendarEventsToSlots = (
  calendarEvents: CalendarEvent[],
  slots: TimeSlot[],
  timeZone: string,
): Map<string, CalendarEvent[]> => {
  if (!calendarEvents.length || !slots.length)
    return new Map<string, CalendarEvent[]>();

  const eventMap = new Map<string, CalendarEvent[]>();

  for (const slot of slots) {
    if (slot.axisType !== "DATE") {
      continue;
    }

    const day = axisDateToCalendarDay(slot.axisDate);
    if (!day) {
      continue;
    }

    // Resolve the slot against the event's time zone, mirroring the backend
    // conflict check so the overlay lines up with the highlighted conflict
    // slots. The browser's local zone would skew the mapping whenever it
    // differs (e.g. a Tokyo event viewed from a Taipei browser).
    const slotStart = calendarDayMinuteToInstant(
      day,
      slot.startMinute,
      timeZone,
    );
    const slotEnd = calendarDayMinuteToInstant(day, slot.endMinute, timeZone);

    const overlappingEvents: CalendarEvent[] = [];

    for (const event of calendarEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check for overlap
      if (slotStart < eventEnd && slotEnd > eventStart) {
        overlappingEvents.push(event);
      }
    }

    if (overlappingEvents.length > 0) {
      eventMap.set(slot.id, overlappingEvents);
    }
  }

  return eventMap;
};

// Format calendar event time
export const formatEventTime = (
  event: CalendarEvent,
  allDayText: string,
): string => {
  if (event.isAllDay) {
    return allDayText;
  }
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const formatTimeFromDate = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return `${formatTimeFromDate(start)} - ${formatTimeFromDate(end)}`;
};
