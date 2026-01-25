import {
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
} from 'class-validator';

// Character limits (same as frontend)
export const TITLE_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 500;

export class CreateEventDto {
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

  @IsDateString()
  startDate: string; // "2025-08-12"

  @IsDateString()
  endDate: string; // "2025-08-15"

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
