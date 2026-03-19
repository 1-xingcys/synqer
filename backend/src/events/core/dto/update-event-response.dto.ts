import { EventScheduleDto } from './hosted-event-list-item.dto';

export class UpdateEventResponseDto {
  id!: string;
  title!: string | null;
  description!: string | null;
  schedule!: EventScheduleDto;
}
