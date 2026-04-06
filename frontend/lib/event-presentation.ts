import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import {
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  EventSchedule,
} from "@/types/event";
import { formatMinutesToTime } from "@/lib/utils";
import { formatWeekdayLabel } from "@/lib/weekdays";

type EventWithDateRange = EventWithCapabilities & {
  type?: EventType;
  schedule?: EventSchedule;
};

export interface VotingDeadlineCountdownState {
  deadlineDate: Date | null;
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
  isUrgent: boolean;
  isVeryCritical: boolean;
}

export function getVotingDeadlineCountdownState(
  votingDeadline: string | null | undefined,
  now: Date,
  isInactive = false,
): VotingDeadlineCountdownState {
  const deadlineDate = votingDeadline ? new Date(votingDeadline) : null;
  const isExpired = deadlineDate ? deadlineDate <= now : false;
  const days = deadlineDate ? differenceInDays(deadlineDate, now) : 0;
  const hours = deadlineDate ? differenceInHours(deadlineDate, now) % 24 : 0;
  const minutes = deadlineDate
    ? differenceInMinutes(deadlineDate, now) % 60
    : 0;
  const totalHours = deadlineDate ? differenceInHours(deadlineDate, now) : 0;
  const isUrgent = !isInactive && totalHours <= 24 && totalHours > 0;
  const isVeryCritical = !isInactive && totalHours <= 6 && totalHours > 0;

  return {
    deadlineDate,
    isExpired,
    days,
    hours,
    minutes,
    totalHours,
    isUrgent,
    isVeryCritical,
  };
}

export function formatEventCandidateDaySummary(
  event: Pick<EventWithDateRange, "type" | "schedule">,
  locale: string,
): string {
  const recurringWeekdays =
    event.type === "RECURRING"
      ? event.schedule?.kind === "RECURRING"
        ? event.schedule.weekdays
        : undefined
      : undefined;

  if (recurringWeekdays?.length) {
    return recurringWeekdays
      .map((weekday) =>
        formatWeekdayLabel(
          weekday,
          locale,
          locale.startsWith("zh") ? "narrow" : "short",
        ),
      )
      .join(", ");
  }

  if (event.schedule?.kind !== "ONE_TIME") {
    return "";
  }

  const start = new Date(event.schedule.startDate);
  const end = new Date(event.schedule.endDate);
  return [
    `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, "0")}/${start
      .getDate()
      .toString()
      .padStart(2, "0")}`,
    `${end.getFullYear()}/${(end.getMonth() + 1).toString().padStart(2, "0")}/${end
      .getDate()
      .toString()
      .padStart(2, "0")}`,
  ].join(" ~ ");
}

export function formatEventScheduleSummary(
  event: EventWithDateRange,
  locale: string,
): string {
  if (event.schedule?.kind === "RECURRING" && event.schedule.weekdays?.length) {
    const weekdayLabels = event.schedule.weekdays.map((weekday) =>
      formatWeekdayLabel(
        weekday,
        locale,
        locale.startsWith("zh") ? "narrow" : "short",
      ),
    );
    const startTime = formatMinutesToTime(event.schedule.startMinuteOfDay ?? 0);
    const endTime = formatMinutesToTime(event.schedule.endMinuteOfDay ?? 0);
    return `${weekdayLabels.join(", ")} • ${startTime} ~ ${endTime}`;
  }

  if (event.schedule?.kind !== "ONE_TIME") {
    return "";
  }

  const start = new Date(event.schedule.startDate);
  const end = new Date(event.schedule.endDate);
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}`;
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}`;
  return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
}

export function formatAxisKeyLabel(
  axisKey: string,
  axisType: EventSlotAxisType,
  locale: string,
): string {
  if (axisType === "WEEKDAY") {
    return formatWeekdayLabel(
      axisKey as Parameters<typeof formatWeekdayLabel>[0],
      locale,
    );
  }

  const date = new Date(axisKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
