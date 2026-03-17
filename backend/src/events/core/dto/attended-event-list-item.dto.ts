import { EventStatus } from '../../shared/services/event-status.service';
import { EventType } from '@prisma/client';
import {
  ConfirmedTimeRangeDto,
  EventCapabilitiesDto,
} from './hosted-event-list-item.dto';

export class AttendedEventHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class AttendedEventListItemDto {
  id!: string;
  type!: EventType;
  title!: string | null;
  description!: string | null;
  startDate!: Date;
  endDate!: Date;
  createdAt!: Date;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  hasVoted!: boolean;
  expectedParticipantCount!: number;
  votedCount!: number;
  host!: AttendedEventHostDto | null;
}
