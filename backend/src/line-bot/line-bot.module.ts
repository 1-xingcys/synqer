import { Module } from '@nestjs/common';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';
import { LineApiService } from './line-api.service';
import { LineGroupService } from './line-group.service';
import { FlexMessageService } from './flex-message.service';
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
    EventStatusService,
  ],
  exports: [
    LineBotService,
    LineApiService,
    LineGroupService,
    FlexMessageService,
    EventStatusService,
  ],
})
export class LineBotModule {}
