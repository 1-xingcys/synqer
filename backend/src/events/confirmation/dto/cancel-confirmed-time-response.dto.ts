import { EventStatus } from '../../shared/services/event-status.service';

export class CancelConfirmedTimeResponseDto {
  id!: string;
  status!: EventStatus;
}

export class DiscardStagedConfirmationResponseDto {
  success!: boolean;
}
