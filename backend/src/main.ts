import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // 啟用 rawBody 以便 LINE Webhook 簽章驗證
    rawBody: true,
  });

  // Configure CORS
  app.enableCors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
  });

  // Trust proxy for Cloud Run / load balancer
  app.set('trust proxy', 1);

  // Configure session
  const cookieSameSite =
    process.env.COOKIE_SAMESITE ??
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
  const cookieSecure =
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production' ||
    cookieSameSite === 'none';

  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: cookieSameSite as 'lax' | 'none' | 'strict',
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
