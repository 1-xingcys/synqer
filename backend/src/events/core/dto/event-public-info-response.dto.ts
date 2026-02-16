import { EventStatus } from '../../shared/services/event-status.service';
import { ConfirmedTimeRangeDto } from './hosted-event-list-item.dto';

export class EventPublicHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class EventPublicInfoResponseDto {
  isDeleted!: boolean;
  id!: string;
  title!: string | null;
  description!: string | null;
  startDate!: Date;
  endDate!: Date;
  createdAt!: Date;
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
  expectedParticipantCount!: number;
  host?: EventPublicHostDto | null;
}
