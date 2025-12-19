import { Module } from '@nestjs/common';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';
import { LineApiService } from './line-api.service';
import { LineGroupService } from './line-group.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [LineBotController],
  providers: [LineBotService, LineApiService, LineGroupService],
  exports: [LineBotService, LineApiService, LineGroupService],
})
export class LineBotModule {}
