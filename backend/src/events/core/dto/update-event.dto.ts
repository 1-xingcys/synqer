import { IsString, IsOptional, IsISO8601, MaxLength } from 'class-validator';
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '../../../../shared/event-validation.constants';

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
  @IsOptional()
  @IsISO8601()
  votingDeadline?: string;
}
