import {
  EventDetailEventDto,
  EventDetailSlotDto,
  EventDetailVoteDto,
} from './event-detail-response.dto';

export class HostedEventParticipantDto {
  userId!: string;
  displayName!: string;
  hasVoted!: boolean;
}

export class HostedEventExpectedParticipantDto {
  id!: string;
  lineUserId?: string;
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  hasVoted!: boolean;
}

export class HostedEventVotingStatsDto {
  totalExpected!: number;
  totalVoted!: number;
  votingPercentage!: number;
}

export class HostedEventDetailResponseDto {
  isDeleted!: boolean;
  event!: EventDetailEventDto;
  slots!: EventDetailSlotDto[];
  votes!: EventDetailVoteDto[];
  participants!: HostedEventParticipantDto[];
  expectedParticipants!: HostedEventExpectedParticipantDto[];
  votingStats!: HostedEventVotingStatsDto;
}
