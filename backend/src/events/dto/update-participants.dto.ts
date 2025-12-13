import { IsArray } from 'class-validator';

interface ParticipantInput {
  lineUserId?: string;
  userId?: string;
}

export class UpdateParticipantsDto {
  @IsArray()
  participants: ParticipantInput[];
}

