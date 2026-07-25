import {
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventVoteMode } from '@prisma/client';
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '../../../../shared/event-validation.constants';
import { GRANULARITY_OPTIONS } from '../../../../shared/event-preference.constants';

/**
 * 更新活動 DTO
 *
 * 注意：為了保持資料一致性，以下欄位不允許更新：
 * - startDate, endDate, startTime, endTime, slotDurationMin
 *   這些欄位會影響 slots 的生成，更新後會造成 slots 與 event 設定不同步
 *
 * 若未來需要支援這些欄位的更新，必須同時重建 slots 並清除相關投票
 */
export class UpdateEventDto {
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

  @IsOptional()
  @IsString()
  timeZone?: string;

  // 投票截止時間（ISO 8601 格式）
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value: string | null | undefined) => value !== null)
  @IsISO8601()
  votingDeadline?: string | null;

  // 時間格的顯示顆粒度
  @ApiPropertyOptional({ enum: GRANULARITY_OPTIONS })
  @IsOptional()
  @IsInt()
  @IsIn([...GRANULARITY_OPTIONS])
  defaultGranularityMin?: number;

  // 參與者進入投票時的初始模式
  @ApiPropertyOptional({ enum: EventVoteMode, enumName: 'EventVoteMode' })
  @IsOptional()
  @IsEnum(EventVoteMode)
  defaultVoteMode?: EventVoteMode;
}
