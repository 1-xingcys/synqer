import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LineBotModule } from '../line-bot/line-bot.module';

@Module({
  imports: [PrismaModule, LineBotModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
