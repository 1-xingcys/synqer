import { addCalendarDays, axisDateToCalendarDay } from "@/lib/calendarDay";
import type { CalendarDay } from "@/lib/calendarDay";
import type { EventSlotAxisType, Weekday } from "@/types/event";

/**
 * The axis position a slot or range occupies.
 *
 * RECURRING events are keyed by weekday, one-time events by calendar day.
 * These used to travel as `startDate: string` plus a sibling `axisType`, which
 * let a weekday sit in a field named `startDate` and reach the date formatter.
 * Tying the payload to the discriminant makes that unrepresentable.
 *
 * A weekday span covers exactly one weekday — only a date span has two ends.
 */
export type AxisSpan =
  | { axisType: "WEEKDAY"; weekday: Weekday }
  | { axisType: "DATE"; startDay: CalendarDay; endDay: CalendarDay };

/** The slot fields an axis span is derived from. */
export type AxisSlotLike = {
  axisType: EventSlotAxisType;
  axisDate?: string | Date | null;
  axisWeekday?: Weekday | null;
};

export function axisSpanOfSlot(slot: AxisSlotLike): AxisSpan | null {
  if (slot.axisType === "WEEKDAY") {
    return slot.axisWeekday
      ? { axisType: "WEEKDAY", weekday: slot.axisWeekday }
      : null;
  }

  const day = axisDateToCalendarDay(slot.axisDate);
  return day ? { axisType: "DATE", startDay: day, endDay: day } : null;
}

/** A stable string key for grouping and sorting spans. */
export function axisSpanKey(span: AxisSpan): string {
  return span.axisType === "WEEKDAY" ? span.weekday : span.startDay;
}

/**
 * Continue `span` with `next` when they are adjacent on the same axis, or null
 * when they are not. Callers merging consecutive slots use the null to start a
 * new range.
 */
export function extendAxisSpan(
  span: AxisSpan,
  next: AxisSpan,
): AxisSpan | null {
  if (span.axisType === "WEEKDAY") {
    return next.axisType === "WEEKDAY" && next.weekday === span.weekday
      ? span
      : null;
  }

  if (next.axisType === "WEEKDAY") return null;

  if (next.startDay !== next.endDay) return null;
  if (next.startDay === span.endDay) return span;
  if (next.startDay !== addCalendarDays(span.endDay, 1)) return null;

  return { axisType: "DATE", startDay: span.startDay, endDay: next.endDay };
}
