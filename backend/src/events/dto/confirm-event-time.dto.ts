import { IsISO8601 } from 'class-validator';

export class ConfirmEventTimeDto {
  @IsISO8601()
  confirmedStartTime: string; // "2025-08-14T10:00:00.000Z"

  @IsISO8601()
  confirmedEndTime: string; // "2025-08-14T12:00:00.000Z"
}
