import { formatWeekdayLabel, getOrderedWeekdays } from "@/lib/weekdays";
import { TimeSlot, Vote, CalendarEvent, GridAxisColumn } from "./types";

function warnInvalidSlot(slot: TimeSlot, reason: string) {
  console.warn(`[timeGrid] Skip invalid slot ${slot.id}: ${reason}`);
}

// Map app locale to date-fns locale string
const getDateLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    "zh-TW": "zh-TW",
    en: "en-US",
  };
  return localeMap[locale] || locale;
};

function parseAxisCalendarDate(rawValue: string): Date {
  if (rawValue.includes("T")) {
    return new Date(rawValue);
  }

  // Date-only axis keys represent a calendar day, not a UTC instant. Parse
  // them into local wall-clock time so headers stay on the same day across
  // environments with negative UTC offsets.
  return new Date(`${rawValue}T12:00:00`);
}

export const formatAxisHeader = (
  column: GridAxisColumn,
  locale: string = "en",
): { weekday: string; day?: number; month?: string } => {
  if (column.kind === "weekday" && column.axisWeekday) {
    return {
      weekday: formatWeekdayLabel(column.axisWeekday, locale),
    };
  }

  const date = parseAxisCalendarDate(column.rawValue);
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

  if (startColumn.kind === "weekday" && endColumn.kind === "weekday") {
    const startLabel =
      startColumn.axisWeekday &&
      formatWeekdayLabel(startColumn.axisWeekday, locale);
    const endLabel =
      endColumn.axisWeekday &&
      formatWeekdayLabel(endColumn.axisWeekday, locale);

    if (!startLabel || !endLabel) return "";
    return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
  }

  const startLabel = formatDatePageValue(startColumn.rawValue);
  const endLabel = formatDatePageValue(endColumn.rawValue);
  return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
};

const formatDatePageValue = (dateStr: string): string => {
  const date = parseAxisCalendarDate(dateStr);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export const buildAxisColumns = (
  axisKeys: string[],
  slotsByAxis: Record<string, TimeSlot[]>,
): GridAxisColumn[] => {
  return axisKeys.map((axisKey) => {
    const firstSlot = slotsByAxis[axisKey]?.[0];

    if (firstSlot?.axisType === "WEEKDAY" && firstSlot.axisWeekday) {
      return {
        key: axisKey,
        kind: "weekday",
        rawValue: axisKey,
        axisWeekday: firstSlot.axisWeekday,
      };
    }

    return {
      key: axisKey,
      kind: "date",
      rawValue: axisKey,
    };
  });
};

export const getSlotAxisKey = (slot: TimeSlot): string | null => {
  if (slot.axisType === "WEEKDAY" && slot.axisWeekday) {
    return slot.axisWeekday;
  }

  if (!slot.axisDate) {
    warnInvalidSlot(slot, "missing axisDate");
    return null;
  }

  return slot.axisDate.split("T")[0];
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
      const axisKey = getSlotAxisKey(slot);
      if (!axisKey) {
        return acc;
      }
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

// Create 2D grid map for quick position lookups
export const createSlotGrid = (
  dates: string[],
  timeSlots: TimeSlot[],
  slotsByDate: Record<string, TimeSlot[]>,
): string[][] => {
  const grid: string[][] = [];
  timeSlots.forEach((_, timeIndex) => {
    grid[timeIndex] = [];
    dates.forEach((dateKey, dateIndex) => {
      const slot = slotsByDate[dateKey][timeIndex];
      if (slot) {
        grid[timeIndex][dateIndex] = slot.id;
      }
    });
  });
  return grid;
};

// Map calendar events to slots
export const mapCalendarEventsToSlots = (
  calendarEvents: CalendarEvent[],
  slots: TimeSlot[],
): Map<string, CalendarEvent[]> => {
  if (!calendarEvents.length || !slots.length)
    return new Map<string, CalendarEvent[]>();

  const eventMap = new Map<string, CalendarEvent[]>();

  for (const slot of slots) {
    if (slot.axisType !== "DATE" || !slot.axisDate) {
      continue;
    }

    const slotDate = new Date(slot.axisDate);
    const slotStart = new Date(slotDate);
    slotStart.setHours(0, 0, 0, 0);
    slotStart.setMinutes(slot.startMinute);

    const slotEnd = new Date(slotDate);
    slotEnd.setHours(0, 0, 0, 0);
    slotEnd.setMinutes(slot.endMinute);

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
