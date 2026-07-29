import {
  ArrayMaxSize,
  ArrayMinSize,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsIn,
  Min,
  Max,
  IsArray,
  IsBoolean,
  IsISO8601,
  MaxLength,
  Matches,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, EventVoteMode, Weekday } from '@prisma/client';
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '../../shared/constants/event-validation.constants';
import { GRANULARITY_OPTIONS } from '../../shared/constants/event-preference.constants';

type CreateEventValidationTarget = {
  type?: EventType;
};

export class CreateEventDto {
  @ApiPropertyOptional({ enum: EventType, enumName: 'EventType' })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsString()
  @MaxLength(TITLE_MAX_LENGTH, {
    message: `Title must be at most ${TITLE_MAX_LENGTH} characters`,
  })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH, {
    message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
  })
  description?: string;

  @ValidateIf(
    (o: CreateEventValidationTarget) =>
      (o.type ?? EventType.ONE_TIME) === EventType.ONE_TIME,
  )
  @IsDateString()
  startDate?: string; // "2025-08-12"

  @ValidateIf(
    (o: CreateEventValidationTarget) =>
      (o.type ?? EventType.ONE_TIME) === EventType.ONE_TIME,
  )
  @IsDateString()
  endDate?: string; // "2025-08-15"

  @ValidateIf(
    (o: CreateEventValidationTarget) => o.type === EventType.RECURRING,
  )
  @ApiPropertyOptional({ enum: Weekday, enumName: 'Weekday', isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsEnum(Weekday, { each: true })
  weekdays?: Weekday[];

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (00:00-23:59)',
  })
  startTime!: string; // "09:00"

  @IsString()
  @Matches(/^(([01]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, {
    message: 'endTime must be in HH:mm format (00:00-24:00)',
  })
  endTime!: string; // "18:00" or "24:00"

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotDurationMin?: number;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({ enum: GRANULARITY_OPTIONS })
  @IsOptional()
  @IsInt()
  @IsIn([...GRANULARITY_OPTIONS])
  defaultGranularityMin?: number;

  @ApiPropertyOptional({ enum: EventVoteMode, enumName: 'EventVoteMode' })
  @IsOptional()
  @IsEnum(EventVoteMode)
  defaultVoteMode?: EventVoteMode;

  // Whether committing a vote posts a notice into the participant's chat.
  @IsBoolean()
  shareVoteToChat!: boolean;

  // Voting deadline (ISO 8601 format)
  @IsOptional()
  @IsISO8601()
  votingDeadline?: string; // "2025-08-14T23:59:59.000Z"

  // LINE group binding (the group's database ID)
  @IsOptional()
  @IsString()
  lineGroupId?: string;

  // LINE userIds of the members expected to vote
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expectedLineUserIds?: string[];
}
