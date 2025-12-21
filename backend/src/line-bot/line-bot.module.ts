import { Module } from '@nestjs/common';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';
import {
  LineApiService,
  LineGroupService,
  FlexMessageService,
  RichMenuService,
} from './services';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { EventStatusService } from '../events/services/event-status.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [LineBotController],
  providers: [
    LineBotService,
    LineApiService,
    LineGroupService,
    FlexMessageService,
    RichMenuService,
    EventStatusService,
  ],
  exports: [
    LineBotService,
    LineApiService,
    LineGroupService,
    FlexMessageService,
    RichMenuService,
    EventStatusService,
  ],
})
export class LineBotModule {}
