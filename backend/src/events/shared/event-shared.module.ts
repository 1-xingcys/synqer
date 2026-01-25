import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfirmedTimeModule } from '../../confirmed-time';

// Services
import { TimeSlotService } from './services/time-slot.service';
import { EventStatusService } from './services/event-status.service';
import { EventAuthorizationService } from './services/event-authorization.service';
import { EventMapperService } from './services/event-mapper.service';

// Repositories
import { EventBaseRepository } from './repositories/event.repository';
import { TimeSlotRepository } from './repositories/time-slot.repository';

@Module({
  imports: [PrismaModule, ConfirmedTimeModule],
  providers: [
    TimeSlotService,
    EventStatusService,
    EventAuthorizationService,
    EventMapperService,
    EventBaseRepository,
    TimeSlotRepository,
  ],
  exports: [
    TimeSlotService,
    EventStatusService,
    EventAuthorizationService,
    EventMapperService,
    EventBaseRepository,
    TimeSlotRepository,
  ],
})
export class EventSharedModule {}
