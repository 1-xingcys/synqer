import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType, Weekday } from '@prisma/client';
import {
  ConfirmedTimeRangeDto,
  EventCapabilitiesDto,
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
  startDate!: Date;
  endDate!: Date;
  @ApiProperty({
    enum: Weekday,
    enumName: 'Weekday',
    isArray: true,
    required: false,
  })
  weekdays?: Weekday[];
  createdAt!: Date;
  startMinuteOfDay?: number;
  endMinuteOfDay?: number;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  expectedParticipantCount!: number;
  host?: EventPublicHostDto | null;
}
