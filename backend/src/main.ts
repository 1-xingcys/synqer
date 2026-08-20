import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import { EnvVars } from './config/env.validation';
import { PrismaService } from './prisma/prisma.service';
import { createSessionStore } from './auth/session-store';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // LINE signs the raw bytes of a webhook request. Re-serialising the
    // parsed JSON is not guaranteed to reproduce them, so verifying the
    // signature needs the original body.
    rawBody: true,
  });

  // Env was validated when AppModule booted, so every read below is safe and
  // typed as non-nullable.
  const config = app.get<ConfigService<EnvVars, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure CORS
  // WEB_ORIGIN is the only accepted origin. In local development it is the
  // tunnel subdomain rather than localhost:3000, because the browser loads the
  // frontend through the tunnel and nginx (:8088), so that subdomain is what
  // it sends as Origin. In production it is synqer.club.
  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });

  // Trust proxy for Cloud Run / load balancer
  // TLS is terminated before the request reaches this process — by Cloud Run
  // in production, by cloudflared locally — so Express has to trust the
  // X-Forwarded-* headers from that hop. Otherwise it judges the connection
  // not to be https and withholds secure cookies.
  app.set('trust proxy', 1);

  // Configure session
  const prisma = app.get(PrismaService);
  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
  app.use(
    session({
      store: createSessionStore(prisma),
      name: 'synqer.sid',
      secret: config.get('SESSION_SECRET', { infer: true }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        // Locally the frontend and backend share one origin through nginx, so
        // lax is enough. In production they are synqer.club and
        // api.synqer.club, which makes every API call cross-site: only 'none'
        // gets the cookie attached, and browsers require secure: true with it.
        sameSite: isProduction ? 'none' : 'lax',
        // Sharing the cookie across subdomains (synqer.club, api.synqer.club).
        // Left unset locally, where the tunnel subdomain has nothing to do
        // with this domain and the cookie would simply be discarded.
        domain: isProduction ? '.synqer.club' : undefined,
      },
    }),
  );

  // PORT is validated by the env schema and defaults to 8080; Cloud Run
  // injects its own value.
  const port = config.get('PORT', { infer: true });
  // Listen on every interface, so the container accepts external requests.
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
