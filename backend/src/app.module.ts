import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { LineBotModule } from './line-bot/line-bot.module';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    UsersModule,
    PrismaModule,
    EventsModule,
    LineBotModule,
    GoogleCalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
