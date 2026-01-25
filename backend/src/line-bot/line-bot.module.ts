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
import { ConfirmedTimeModule } from '../confirmed-time';
import { EventSharedModule } from '../events/shared/event-shared.module';

@Module({
  imports: [PrismaModule, UsersModule, ConfirmedTimeModule, EventSharedModule],
  controllers: [LineBotController],
  providers: [
    LineBotService,
    LineApiService,
    LineGroupService,
    FlexMessageService,
    RichMenuService,
  ],
  exports: [
    LineBotService,
    LineApiService,
    LineGroupService,
    FlexMessageService,
    RichMenuService,
  ],
})
export class LineBotModule {}
