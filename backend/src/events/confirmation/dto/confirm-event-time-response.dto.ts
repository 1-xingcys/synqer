import { EventStatus } from '../../shared/services/event-status.service';

export class ConfirmEventTimeResponseDto {
  id!: string;
  confirmedSlotIds!: string[];
  status!: EventStatus;
}
