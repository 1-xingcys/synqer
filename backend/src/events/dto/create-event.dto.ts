import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
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
}
