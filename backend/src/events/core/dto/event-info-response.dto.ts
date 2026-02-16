import { ParticipantStatus } from '../../shared/services/event-status.service';
import { EventDetailEventDto } from './event-detail-response.dto';

export class EventInfoEventDto extends EventDetailEventDto {
  createdAt!: Date;
}

export class EventInfoHostDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class EventInfoExpectedParticipantUserDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class EventInfoExpectedParticipantDto {
  id!: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted!: boolean;
  status!: ParticipantStatus;
  user?: EventInfoExpectedParticipantUserDto;
}

export class EventInfoResponseDto {
  isDeleted!: boolean;
  event!: EventInfoEventDto;
  host!: EventInfoHostDto | null;
  expectedParticipants!: EventInfoExpectedParticipantDto[];
  currentUserHasVoted!: boolean;
}
