import type { EventSlotAxisType, Weekday } from "@/types/event";
import type { AxisSpan } from "@/lib/event/axisSpan";

export interface EventSlot {
  id: string;
  axisType: EventSlotAxisType;
  axisDate?: string | Date | null;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
}

export interface SelectedTimeRange {
  id: string;
  axis: AxisSpan;
  startTime: number;
  endTime: number;
  slotIds: string[];
  isConfirmed?: boolean;
  isStaged?: boolean;
  isToBeRemoved?: boolean;
}
