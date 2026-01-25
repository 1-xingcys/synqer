import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventSharedModule } from '../shared/event-shared.module';

// Controller
import { EventCoreController } from './event-core.controller';

// Services
import { EventCreationService } from './services/event-creation.service';
import { EventQueryService } from './services/event-query.service';
import { EventUpdateService } from './services/event-update.service';

// Repositories
import { EventRepository } from './repositories/event.repository';

@Module({
  imports: [PrismaModule, EventSharedModule],
  controllers: [EventCoreController],
  providers: [
    // Services
    EventCreationService,
    EventQueryService,
    EventUpdateService,
    // Repositories
    EventRepository,
  ],
  exports: [EventCreationService, EventQueryService, EventUpdateService],
})
export class EventCoreModule {}
