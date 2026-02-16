import { EventStatus } from '../../shared/services/event-status.service';

export class ConfirmedTimeRangeDto {
  startTime!: Date;
  endTime!: Date;
  slotIds!: string[];
}

export class HostedEventListItemDto {
  id!: string;
  title!: string | null;
  description!: string | null;
  startDate!: Date;
  endDate!: Date;
  createdAt!: Date;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
  expectedParticipantCount!: number;
  votedCount!: number;
}
