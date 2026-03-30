import type { EventSlotAxisType, Weekday } from "@/types/event";

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
  startDate: string;
  endDate: string;
  axisType: EventSlotAxisType;
  startTime: number;
  endTime: number;
  slotIds: string[];
  isConfirmed?: boolean;
  isStaged?: boolean;
  isToBeRemoved?: boolean;
}
