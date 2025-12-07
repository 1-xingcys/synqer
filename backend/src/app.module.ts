import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { LineBotModule } from './line-bot/line-bot.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, EventsModule, LineBotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
