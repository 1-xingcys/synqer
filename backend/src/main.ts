import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import { requireEnv } from './config/env.util';

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
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    session({
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

  const port = 8080;
  const host = '0.0.0.0'; // 监听所有网络接口，确保 Docker 容器可以接收外部请求
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
