import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { requireEnv } from './config/env.util';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 啟用 rawBody 以便 LINE Webhook 簽章驗證
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
  });

  // Trust proxy for Cloud Run / load balancer
  app.set('trust proxy', 1);

  // Configure session
  const prisma = app.get(PrismaService);
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    session({
      store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000, // prune expired sessions every 2 minutes
        dbRecordIdIsSessionId: true,
      }),
      name: 'synqer.sid',
      secret: requireEnv('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: isProduction ? 'none' : 'lax',
        // 設定 domain 讓 cookie 可以在所有子域名共享 (synqer.club, api.synqer.club)
        domain: isProduction ? '.synqer.club' : undefined,
      },
    }),
  );

  // PORT 由 env schema 驗證並帶預設值（8080）；Cloud Run 會注入此變數
  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  const host = '0.0.0.0'; // 监听所有网络接口，确保 Docker 容器可以接收外部请求
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
