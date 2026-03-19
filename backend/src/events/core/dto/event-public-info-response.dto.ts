import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType, Weekday } from '@prisma/client';
import {
  ConfirmedSelectionDto,
  EventCapabilitiesDto,
  EventScheduleDto,
} from './hosted-event-list-item.dto';

export class EventPublicHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class EventPublicInfoResponseDto {
  isDeleted!: boolean;
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
  expectedParticipantCount!: number;
  host?: EventPublicHostDto | null;
}
