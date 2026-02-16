import { EventStatus } from '../../shared/services/event-status.service';
import { ConfirmedTimeRangeDto } from './hosted-event-list-item.dto';

export class EventDetailEventDto {
  id!: string;
  title!: string | null;
  description!: string | null;
  startDate!: Date;
  endDate!: Date;
  startMinuteOfDay!: number;
  endMinuteOfDay!: number;
  slotDurationMin!: number;
  timeZone!: string;
  lineGroupId!: string | null;
  ownerId!: string | null;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedTimeRanges!: ConfirmedTimeRangeDto[];
  status!: EventStatus;
}

export class EventDetailLineGroupDto {
  id!: string;
  lineGroupId!: string;
  groupName!: string | null;
}

export class EventDetailSlotDto {
  id!: string;
  eventId!: string;
  date!: Date;
  startMinute!: number;
  endMinute!: number;
  index!: number;
}

export class EventDetailVoteDto {
  slotId!: string;
  userId!: string;
  userDisplayName!: string;
}

export class EventDetailParticipantDto {
  userId!: string;
  displayName!: string;
}

export class EventDetailExpectedParticipantUserDto {
  id!: string;
  displayName!: string | null;
  avatarUrl!: string | null;
}

export class EventDetailExpectedParticipantDto {
  id!: string;
  lineUserId!: string | null;
  userId!: string | null;
  hasVoted!: boolean;
  reminderSentAt!: Date | null;
  user!: EventDetailExpectedParticipantUserDto | null;
}

export class EventDetailResponseDto {
  isDeleted!: boolean;
  event!: EventDetailEventDto;
  lineGroup!: EventDetailLineGroupDto | null;
  slots!: EventDetailSlotDto[];
  votes!: EventDetailVoteDto[];
  participants!: EventDetailParticipantDto[];
  expectedParticipants!: EventDetailExpectedParticipantDto[];
}
