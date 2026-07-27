import { type EventSlotAxisType, type Weekday } from "@/types/event";
import {
  axisSpanKey,
  axisSpanOfSlot,
  extendAxisSpan,
  type AxisSpan,
} from "@/lib/axisSpan";
import { CANONICAL_WEEKDAY_ORDER } from "@/lib/weekdays";

export type HostedResultSlot = {
  id: string;
  axisType: EventSlotAxisType;
  axisDate?: string | null;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
};

type MergedConfirmedRange = {
  axis: AxisSpan;
  startMinute: number;
  endMinute: number;
  slotIds: string[];
};

export type HostedResultVote = {
  slotId: string;
  userId: string;
};

export type HostedResultExpectedParticipant = {
  id: string;
  lineUserId?: string | null;
  userId?: string | null;
  displayName?: string | null;
};

export type HostedResultSummaryParticipant = {
  name: string;
};

export type HostedResultSummaryRange = {
  axis: AxisSpan;
  startMinute: number;
  endMinute: number;
  availableCount: number;
  unavailableParticipants: HostedResultSummaryParticipant[];
};

export type HostedEventResultSummary = {
  totalExpected: number;
  ranges: HostedResultSummaryRange[];
};

function sortSlots(slots: HostedResultSlot[]) {
  return [...slots].sort((left, right) => {
    if (
      left.axisType === "WEEKDAY" &&
      right.axisType === "WEEKDAY" &&
      left.axisWeekday &&
      right.axisWeekday
    ) {
      const weekdayDiff =
        CANONICAL_WEEKDAY_ORDER.indexOf(left.axisWeekday) -
        CANONICAL_WEEKDAY_ORDER.indexOf(right.axisWeekday);
      if (weekdayDiff !== 0) {
        return weekdayDiff;
      }

      return left.startMinute - right.startMinute;
    }

    const leftSpan = axisSpanOfSlot(left);
    const rightSpan = axisSpanOfSlot(right);
    if (leftSpan && rightSpan) {
      const leftKey = axisSpanKey(leftSpan);
      const rightKey = axisSpanKey(rightSpan);
      if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey);
      }
    }

    return left.startMinute - right.startMinute;
  });
}

function mergeConfirmedSlots(
  slots: HostedResultSlot[],
): MergedConfirmedRange[] {
  if (slots.length === 0) return [];

  const merged: MergedConfirmedRange[] = [];

  sortSlots(slots).forEach((slot) => {
    const span = axisSpanOfSlot(slot);
    if (!span) return;

    const current = merged[merged.length - 1];
    const extended = current && extendAxisSpan(current.axis, span);

    if (current && extended && current.endMinute === slot.startMinute) {
      current.axis = extended;
      current.endMinute = slot.endMinute;
      current.slotIds.push(slot.id);
      return;
    }

    merged.push({
      axis: span,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      slotIds: [slot.id],
    });
  });

  return merged;
}

export function buildHostedEventResultSummary(opts: {
  confirmedSlots: HostedResultSlot[];
  votes: HostedResultVote[];
  expectedParticipants: HostedResultExpectedParticipant[];
}): HostedEventResultSummary {
  const normalizedExpectedParticipants = opts.expectedParticipants.map(
    (participant, index) => {
      const name =
        participant.displayName?.trim() || participant.lineUserId?.trim();
      const candidateIds = [participant.userId, participant.lineUserId].filter(
        (value): value is string => Boolean(value),
      );
      return {
        name,
        candidateIds,
        participantIndex: index,
      };
    },
  );

  const expectedNameByParticipantIndex = new Map<number, string>();
  const expectedParticipantByIndex = new Map<
    number,
    HostedResultSummaryParticipant
  >();
  const expectedIndexById = new Map<string, number>();

  normalizedExpectedParticipants.forEach(
    ({ name, candidateIds, participantIndex }) => {
      if (!name) return;

      expectedNameByParticipantIndex.set(participantIndex, name);
      expectedParticipantByIndex.set(participantIndex, { name });
      candidateIds.forEach((id) => {
        expectedIndexById.set(id, participantIndex);
      });
    },
  );

  const totalExpected = expectedNameByParticipantIndex.size;
  const mergedRanges = mergeConfirmedSlots(opts.confirmedSlots);
  const confirmedSlotIdSet = new Set(
    opts.confirmedSlots.map((slot) => slot.id),
  );
  const attendeeIndexesBySlot = new Map<string, Set<number>>();

  opts.votes.forEach((vote) => {
    if (!confirmedSlotIdSet.has(vote.slotId)) return;

    const participantIndex = expectedIndexById.get(vote.userId);
    if (participantIndex === undefined) return;

    if (!attendeeIndexesBySlot.has(vote.slotId)) {
      attendeeIndexesBySlot.set(vote.slotId, new Set());
    }
    attendeeIndexesBySlot.get(vote.slotId)?.add(participantIndex);
  });

  const ranges = mergedRanges.map((range) => {
    let attendeeIndexes: Set<number> | null = null;

    range.slotIds.forEach((slotId) => {
      const slotAttendees =
        attendeeIndexesBySlot.get(slotId) || new Set<number>();

      if (attendeeIndexes === null) {
        attendeeIndexes = new Set(slotAttendees);
        return;
      }

      attendeeIndexes = new Set(
        Array.from(attendeeIndexes).filter((participantIndex) =>
          slotAttendees.has(participantIndex),
        ),
      );
    });

    const availableIndexes = attendeeIndexes || new Set<number>();
    const unavailableParticipants: HostedResultSummaryParticipant[] = [];

    expectedParticipantByIndex.forEach((participant, participantIndex) => {
      if (!availableIndexes.has(participantIndex)) {
        unavailableParticipants.push(participant);
      }
    });

    unavailableParticipants.sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    return {
      axis: range.axis,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
      availableCount: availableIndexes.size,
      unavailableParticipants,
    };
  });

  return {
    totalExpected,
    ranges,
  };
}
