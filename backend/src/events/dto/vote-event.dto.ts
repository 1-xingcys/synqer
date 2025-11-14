import { IsArray, IsString } from 'class-validator';

export class VoteEventDto {
  @IsArray()
  @IsString({ each: true })
  availableSlotIds: string[];
}
