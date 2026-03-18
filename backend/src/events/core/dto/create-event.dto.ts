import {
  ArrayMaxSize,
  ArrayMinSize,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  IsISO8601,
  MaxLength,
  Matches,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, Weekday } from '@prisma/client';
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '../../../../shared/event-validation.constants';

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

  @ValidateIf((o) => (o.type ?? EventType.ONE_TIME) === EventType.ONE_TIME)
  @IsDateString()
  startDate?: string; // "2025-08-12"

  @ValidateIf((o) => (o.type ?? EventType.ONE_TIME) === EventType.ONE_TIME)
  @IsDateString()
  endDate?: string; // "2025-08-15"

  @ValidateIf((o) => o.type === EventType.RECURRING)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsEnum(Weekday, { each: true })
  weekdays?: Weekday[];

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (00:00-23:59)',
  })
  startTime: string; // "09:00"

  @IsString()
  @Matches(/^(([01]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, {
    message: 'endTime must be in HH:mm format (00:00-24:00)',
  })
  endTime: string; // "18:00" or "24:00"

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotDurationMin?: number; // 預設 15，未來可支援 30/60

  @IsOptional()
  @IsString()
  timeZone?: string; // 預設 "Asia/Taipei"

  // 投票截止時間（ISO 8601 格式）
  @IsOptional()
  @IsISO8601()
  votingDeadline?: string; // "2025-08-14T23:59:59.000Z"

  // LINE 群組綁定（群組的資料庫 ID）
  @IsOptional()
  @IsString()
  lineGroupId?: string;

  // 預期應該投票的成員 LINE userIds
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expectedLineUserIds?: string[];
}
