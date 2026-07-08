import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../shared/services/event-status.service';
import { EventType } from '@prisma/client';
import {
  ConfirmedSelectionDto,
  EventCapabilitiesDto,
  EventScheduleDto,
  AttendedEventHostDto,
} from './event-shared.dto';

/**
 * 統一活動清單項目：主辦 ∪ 參與，以 isHost 區分角色。
 */
export class MyEventListItemDto {
  id!: string;
  @ApiProperty({ enum: EventType, enumName: 'EventType' })
  type!: EventType;
  title!: string | null;
  description!: string | null;
  schedule!: EventScheduleDto;
  createdAt!: Date;
  votingDeadline!: Date | null;
  confirmedSlotIds!: string[];
  confirmedSelections!: ConfirmedSelectionDto[];
  status!: EventStatus;
  capabilities!: EventCapabilitiesDto;
  expectedParticipantCount!: number;
  votedCount!: number;
  hasVoted!: boolean;
  host!: AttendedEventHostDto | null;
  isHost!: boolean;
}
