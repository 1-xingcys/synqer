import type { operations } from "@/generated/openapi";
import {
  EventCapabilities,
  EventSchedule,
  EventType,
  Weekday,
} from "@/types/event";

type HostedEventsResponse =
  operations["EventCoreController_findMyEvents"]["responses"][200]["content"]["application/json"];
type AttendedEventsResponse =
  operations["EventCoreController_findAttendedEvents"]["responses"][200]["content"]["application/json"];
type EventDetailResponse =
  operations["EventCoreController_findOne"]["responses"][200]["content"]["application/json"];
type HostedEventDetailResponse =
  operations["EventCoreController_findOneHosted"]["responses"][200]["content"]["application/json"];

type EventLike = {
  type: EventType;
  capabilities: EventCapabilities;
  startDate: string;
  endDate: string;
  weekdays?: Weekday[];
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  slotDurationMin?: number;
};

export type NormalizedEventLike<T extends EventLike> = Omit<
  T,
  "type" | "startDate" | "endDate"
> & {
  type: EventType;
  schedule: EventSchedule;
};

function buildSchedule(event: EventLike): EventSchedule {
  if (event.type === "RECURRING") {
    return {
      kind: "RECURRING",
      weekdays: event.weekdays,
      startMinuteOfDay: event.startMinuteOfDay,
      endMinuteOfDay: event.endMinuteOfDay,
      slotDurationMin: event.slotDurationMin,
    };
  }

  return {
    kind: "ONE_TIME",
    startDate: event.startDate,
    endDate: event.endDate,
    startMinuteOfDay: event.startMinuteOfDay,
    endMinuteOfDay: event.endMinuteOfDay,
    slotDurationMin: event.slotDurationMin,
  };
}

export function normalizeEventLike<T extends EventLike>(
  event: T,
): NormalizedEventLike<T> {
  const { startDate: _startDate, endDate: _endDate, type, ...rest } = event;
  return {
    ...rest,
    type,
    schedule: buildSchedule(event),
  };
}

export function normalizeHostedEventsResponse(response: HostedEventsResponse) {
  return response.map((event) => normalizeEventLike(event));
}

export function normalizeAttendedEventsResponse(
  response: AttendedEventsResponse,
) {
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
