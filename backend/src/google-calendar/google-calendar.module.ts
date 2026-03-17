import { Module } from '@nestjs/common';
import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventSharedModule } from '../events/shared/event-shared.module';

@Module({
  imports: [PrismaModule, EventSharedModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
