import type { EventSlotAxisType } from "@/types/event";

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
