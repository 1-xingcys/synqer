import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LineBotModule } from '../line-bot/line-bot.module';
import {
  EventStatusService,
  TimeSlotService,
  EventParticipantService,
  EventVoteService,
  EventAuthorizationService,
  EventMapperService,
  EventQueryService,
  EventCreationService,
} from './services';

@Module({
  imports: [PrismaModule, LineBotModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventStatusService,
    TimeSlotService,
    EventParticipantService,
    EventVoteService,
    EventAuthorizationService,
    EventMapperService,
    EventQueryService,
    EventCreationService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
