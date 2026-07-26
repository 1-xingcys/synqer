import {
  IsString,
  IsOptional,
  IsBoolean,
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
 * Update event DTO
 *
 * Note: to keep data consistent, the following fields cannot be updated:
 * - startDate, endDate, startTime, endTime, slotDurationMin
 *   These fields affect slot generation, so updating them would leave the slots
 *   out of sync with the event settings.
 *
 * If updating these fields needs to be supported later, the slots must be
 * regenerated and the related votes cleared at the same time.
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

  // Voting deadline (ISO 8601 format)
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value: string | null | undefined) => value !== null)
  @IsISO8601()
  votingDeadline?: string | null;

  // Display granularity of the time grid
  @ApiPropertyOptional({ enum: GRANULARITY_OPTIONS })
  @IsOptional()
  @IsInt()
  @IsIn([...GRANULARITY_OPTIONS])
  defaultGranularityMin?: number;

  // Initial mode participants get when they open the vote
  @ApiPropertyOptional({ enum: EventVoteMode, enumName: 'EventVoteMode' })
  @IsOptional()
  @IsEnum(EventVoteMode)
  defaultVoteMode?: EventVoteMode;

  // Whether committing a vote posts a notice into the participant's chat
  @IsOptional()
  @IsBoolean()
  shareVoteToChat?: boolean;
}
