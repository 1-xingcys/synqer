import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType, Weekday } from '@prisma/client';
import { EventCapabilities } from '../../shared/interfaces/event-contract.interface';
import { ConfirmedSelectionKind } from '../../shared/interfaces/confirmed-time.interface';

export class ConfirmedSelectionDto {
  @ApiProperty({
    enum: Object.values(ConfirmedSelectionKind),
    enumName: 'ConfirmedSelectionKind',
  })
  kind!: (typeof ConfirmedSelectionKind)[keyof typeof ConfirmedSelectionKind];

  slotIds!: string[];

  startTime?: Date;
  endTime?: Date;

  @ApiProperty({ enum: Weekday, enumName: 'Weekday', required: false })
  weekday?: Weekday;

  startMinute?: number;
  endMinute?: number;
}

export class EventCapabilitiesDto implements EventCapabilities {
  supportsCompletion!: boolean;
  supportsCalendarConflict!: boolean;
  supportsAddToCalendar!: boolean;
}

export class EventScheduleDto {
  @ApiProperty({ enum: EventType, enumName: 'EventType' })
  kind!: EventType;

  startDate?: Date;
  endDate?: Date;

  @ApiProperty({
    enum: Weekday,
    enumName: 'Weekday',
    isArray: true,
    required: false,
  })
  weekdays?: Weekday[];

  startMinuteOfDay!: number;
  endMinuteOfDay!: number;
  slotDurationMin!: number;
}

export class HostedEventListItemDto {
  id!: string;
  @ApiProperty({ enum: EventType, enumName: 'EventType' })
  type!: EventType;
  title!: string | null;
  description!: string | null;
  schedule!: EventScheduleDto;
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
  confirmedSelections!: ConfirmedSelectionDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  expectedParticipantCount!: number;
  votedCount!: number;
}
