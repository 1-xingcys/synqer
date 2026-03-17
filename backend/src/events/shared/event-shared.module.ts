import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

// Services
import { TimeSlotService } from './services/time-slot.service';
import { EventStatusService } from './services/event-status.service';
import { EventAuthorizationService } from './services/event-authorization.service';
import { EventMapperService } from './services/event-mapper.service';
import { ConfirmedTimeService } from './services/confirmed-time.service';
import { EventCapabilitiesService } from './services/event-capabilities.service';

// Repositories
import { EventBaseRepository } from './repositories/event.repository';
import { TimeSlotRepository } from './repositories/time-slot.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    TimeSlotService,
    EventStatusService,
    EventAuthorizationService,
    EventMapperService,
    ConfirmedTimeService,
    EventCapabilitiesService,
    EventBaseRepository,
    TimeSlotRepository,
  ],
  exports: [
    TimeSlotService,
    EventStatusService,
    EventAuthorizationService,
    EventMapperService,
    ConfirmedTimeService,
    EventCapabilitiesService,
    EventBaseRepository,
    TimeSlotRepository,
  ],
})
export class EventSharedModule {}
