import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType, Weekday } from '@prisma/client';
import { EventCapabilities } from '../../shared/interfaces/event-contract.interface';

export class ConfirmedTimeRangeDto {
  startTime!: Date;
  endTime!: Date;
  slotIds!: string[];
}

export class EventCapabilitiesDto implements EventCapabilities {
  supportsCompletion!: boolean;
  supportsCalendarConflict!: boolean;
  supportsAddToCalendar!: boolean;
}

export class HostedEventListItemDto {
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
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  expectedParticipantCount!: number;
  votedCount!: number;
}
