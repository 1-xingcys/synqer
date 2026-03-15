import { EventStatus } from '../../shared/services/event-status.service';

export class ConfirmEventTimeResponseDto {
  id!: string;
  confirmedSlotIds!: string[];
  status!: EventStatus;
}

export class UpdateStagedConfirmationResponseDto {
  success!: boolean;
  stagedSlotCount!: number;
}

export class CommitStagedConfirmationResponseDto {
  id!: string;
  confirmedSlotIds!: string[];
  status!: EventStatus;
}
