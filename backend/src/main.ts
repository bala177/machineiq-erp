import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  // ── Startup secret validation ──────────────────────────────────────────────
  const jwtSecret = configService.get<string>('JWT_SECRET', '');
  if (!jwtSecret || jwtSecret.startsWith('change-this') || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too weak. Set a random secret of at least 32 characters in .env (e.g. openssl rand -base64 32)',
    );
  }

  // ── Security headers (Helmet) ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // needed for Socket.IO
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  const rawOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:4050');
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // preflight cache 24h
  });

  // Intake/reference attachments are stored as data URLs today, so image saves
  // need a larger JSON body limit than Express' small default.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  // ── Global pipes ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: true, // reject requests with extra fields
      transform: true,
    }),
  );

  // ── Global exception filter (no stack traces to client) ───────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = configService.get<number>('PORT', 4051);
  // Bind to 0.0.0.0 so PaaS hosts (Render, Railway, Fly) can route traffic to the container.
  await app.listen(port, '0.0.0.0');
  logger.log(`MachineIQ backend running on port ${port}`);
}

bootstrap();
