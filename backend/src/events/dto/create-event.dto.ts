import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  IsISO8601,
} from 'class-validator';

export class CreateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string; // "2025-08-12"

  @IsDateString()
  endDate: string; // "2025-08-15"

  @IsString()
  startTime: string; // "09:00"

  @IsString()
  endTime: string; // "18:00"

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
