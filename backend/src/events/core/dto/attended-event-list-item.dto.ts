import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType } from '@prisma/client';
import {
  ConfirmedSelectionDto,
  EventCapabilitiesDto,
  EventScheduleDto,
} from './hosted-event-list-item.dto';

export class AttendedEventHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class AttendedEventListItemDto {
  id!: string;
  @ApiProperty({ enum: EventType, enumName: 'EventType' })
  type!: EventType;
  title!: string | null;
  description!: string | null;
  schedule!: EventScheduleDto;
  createdAt!: Date;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedSelections!: ConfirmedSelectionDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  hasVoted!: boolean;
  expectedParticipantCount!: number;
  votedCount!: number;
  host!: AttendedEventHostDto | null;
}
