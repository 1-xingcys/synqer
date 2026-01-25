import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantInput {
  @IsOptional()
  @IsString()
  lineUserId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateParticipantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantInput)
  participants: ParticipantInput[];
}
