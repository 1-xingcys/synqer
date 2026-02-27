export const MIN_HOURS_BEFORE_EVENT = 1;

export interface CreateEventFormData {
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  timeZone: string;
  votingDeadline: Date | null;
  votingDeadlineTime: string;
  votingDeadlineManuallySet: boolean;
  lineGroupId: string | null;
  selectedLineUserIds: string[];
}
