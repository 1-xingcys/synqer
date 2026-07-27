import type { operations } from "@/generated/openapi";
import { wallClockToCalendarDay } from "@/lib/calendarDay";
import {
  EventCapabilities,
  EventSchedule,
  EventType,
  Weekday,
} from "@/types/event";

type EventDetailResponse =
  operations["EventCoreController_findOne"]["responses"][200]["content"]["application/json"];
type HostedEventDetailResponse =
  operations["EventCoreController_findOneHosted"]["responses"][200]["content"]["application/json"];
type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];
type MyEventsResponse =
  operations["EventCoreController_findMyInvolvedEvents"]["responses"][200]["content"]["application/json"];

type EventLike = {
  type: EventType;
  capabilities: EventCapabilities;
  schedule: {
    kind: EventType;
    startDate?: string;
    endDate?: string;
    weekdays?: Weekday[];
    startMinuteOfDay?: number;
    endMinuteOfDay?: number;
    slotDurationMin?: number;
  };
};

export type NormalizedEventLike<T extends EventLike> = Omit<
  T,
  "type" | "schedule"
> & {
  type: EventType;
  schedule: EventSchedule;
};

/**
 * Candidate days arrive as naive UTC-midnight timestamps
 * ("2026-07-30T00:00:00.000Z"). Convert them to calendar days here, at the one
 * place every response passes through, so no downstream reader has to decide
 * whether that string is an instant or a day — the ambiguity that repeatedly
 * shifted these dates onto the wrong day.
 */
function toCandidateDay(value: string): string {
  return wallClockToCalendarDay(new Date(value));
}

function requireField<T>(
  value: T | null | undefined,
  fieldName: string,
  eventType: EventType,
): T {
  if (value === null || value === undefined) {
    throw new Error(
      `Missing required schedule field "${fieldName}" for ${eventType} event`,
    );
  }

  return value;
}

function buildSchedule(event: EventLike): EventSchedule {
  if (event.schedule.kind === "RECURRING") {
    return {
      kind: "RECURRING",
      weekdays: requireField(
        event.schedule.weekdays,
        "weekdays",
        event.schedule.kind,
      ),
      startMinuteOfDay: requireField(
        event.schedule.startMinuteOfDay,
        "startMinuteOfDay",
        event.schedule.kind,
      ),
      endMinuteOfDay: requireField(
        event.schedule.endMinuteOfDay,
        "endMinuteOfDay",
        event.schedule.kind,
      ),
      slotDurationMin: requireField(
        event.schedule.slotDurationMin,
        "slotDurationMin",
        event.schedule.kind,
      ),
    };
  }

  return {
    kind: "ONE_TIME",
    startDate: toCandidateDay(
      requireField(event.schedule.startDate, "startDate", event.schedule.kind),
    ),
    endDate: toCandidateDay(
      requireField(event.schedule.endDate, "endDate", event.schedule.kind),
    ),
    startMinuteOfDay: requireField(
      event.schedule.startMinuteOfDay,
      "startMinuteOfDay",
      event.schedule.kind,
    ),
    endMinuteOfDay: requireField(
      event.schedule.endMinuteOfDay,
      "endMinuteOfDay",
      event.schedule.kind,
    ),
    slotDurationMin: requireField(
      event.schedule.slotDurationMin,
      "slotDurationMin",
      event.schedule.kind,
    ),
  };
}

export function normalizeEventLike<T extends EventLike>(
  event: T,
): NormalizedEventLike<T> {
  const { type, schedule: _schedule, ...rest } = event;
  return {
    ...rest,
    type,
    schedule: buildSchedule(event),
  };
}

export function normalizeMyEventsResponse(response: MyEventsResponse) {
  return response.map((event) => normalizeEventLike(event));
}

export function normalizeEventDetailResponse(response: EventDetailResponse) {
  return {
    ...response,
    event: normalizeEventLike(response.event),
  };
}

export function normalizeHostedEventDetailResponse(
  response: HostedEventDetailResponse,
) {
  return {
    ...response,
    event: normalizeEventLike(response.event),
  };
}

export function normalizeEventPublicInfoResponse(
  response: EventPublicInfoResponse,
) {
  return normalizeEventLike(response);
}
