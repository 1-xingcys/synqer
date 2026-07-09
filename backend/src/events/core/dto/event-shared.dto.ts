import { ApiProperty } from '@nestjs/swagger';
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

export class AttendedEventHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}
