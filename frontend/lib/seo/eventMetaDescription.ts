import { formatEventCandidateDaySummary } from "@/lib/event/event-presentation";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";
import { formatWallClock, type WallClock } from "@/lib/time";
import type { EventSchedule, EventType } from "@/types/event";

/**
 * The `eventInfo.*` strings this description is built from.
 *
 * They are passed in rather than looked up so the function stays pure: it runs
 * on the server inside `generateMetadata`, where a hook-based translator is not
 * available, and it is the only part of the metadata worth unit testing.
 */
export interface EventMetaDescriptionLabels {
  candidateDates: string;
  candidateWeekdays: string;
  candidateTime: string;
  votingDeadline: string;
  noDeadline: string;
}

export interface EventMetaDescriptionInput {
  type: EventType;
  schedule: EventSchedule;
  timeZone: string;
  votingDeadline?: WallClock | null;
}

const SEPARATOR = " · ";

/** One labelled row of an event's schedule. */
export interface EventScheduleField {
  label: string;
  value: string;
}

/**
 * What an event's schedule says, as labelled rows.
 *
 * It says what EventConfigurationSummary shows, in the same order and through
 * the same formatters, so the description a link previews with and the panel
 * behind it cannot drift apart.
 *
 * Rows rather than a string because the share card stacks them into a column
 * while the description runs them together into a line. Both readings come
 * from here, so there is one answer to what an event's schedule is.
 *
 * The time zone rides along with the daily window rather than standing as a
 * row of its own: these are wall-clock values belonging to the event, and
 * "09:00 ~ 18:00" alone reads as the viewer's own clock.
 */
export function eventScheduleFields(
  event: EventMetaDescriptionInput,
  locale: string,
  labels: EventMetaDescriptionLabels,
): EventScheduleField[] {
  const days = formatEventCandidateDaySummary(event, locale);

  const window = `${formatMinutesToTime(event.schedule.startMinuteOfDay)} ~ ${formatMinutesToTime(event.schedule.endMinuteOfDay)} (${event.timeZone})`;

  const deadline = event.votingDeadline
    ? formatWallClock(event.votingDeadline)
    : labels.noDeadline;

  return [
    // A recurring event with no weekdays summarises to "", which would leave a
    // label dangling in front of nothing.
    ...(days
      ? [
          {
            label:
              event.type === "RECURRING"
                ? labels.candidateWeekdays
                : labels.candidateDates,
            value: days,
          },
        ]
      : []),
    { label: labels.candidateTime, value: window },
    { label: labels.votingDeadline, value: deadline },
  ];
}

/**
 * The same rows as one line of prose, for `<meta name="description">` and for
 * the share preview's own description.
 */
export function formatEventMetaDescription(
  event: EventMetaDescriptionInput,
  locale: string,
  labels: EventMetaDescriptionLabels,
): string {
  return eventScheduleFields(event, locale, labels)
    .map((field) => `${field.label} ${field.value}`)
    .join(SEPARATOR);
}
