import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
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
