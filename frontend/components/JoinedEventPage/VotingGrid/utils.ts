import { TimeSlot, Vote, CalendarEvent } from "./types";

// Format time from minutes to HH:MM string
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// Map app locale to date-fns locale string
const getDateLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    "zh-TW": "zh-TW",
    en: "en-US",
  };
  return localeMap[locale] || locale;
};

// Format date header information
export const formatDateHeader = (
  dateStr: string,
  locale: string = "en",
): { weekday: string; day: number; month: string } => {
  const date = new Date(dateStr);
  const dateLocale = getDateLocale(locale);
  const weekday = date.toLocaleDateString(dateLocale, { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString(dateLocale, { month: "short" });
  return { weekday, day, month };
};

// Group slots by date
export const groupSlotsByDate = (
  slots: TimeSlot[],
): Record<string, TimeSlot[]> => {
  return slots.reduce(
    (acc, slot) => {
      const dateKey = slot.date.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
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
    const slotDate = new Date(slot.date);
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
