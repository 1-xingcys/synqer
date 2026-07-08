import { EventScheduleDto } from './event-shared.dto';

export class UpdateEventResponseDto {
  id!: string;
  title!: string | null;
  description!: string | null;
  schedule!: EventScheduleDto;
}
