import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── 1. Prefijo global ──────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── 2. CORS ────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : []),
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido → ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400,
  });

  // ── 3. WebSocket adapter ───────────────────────────────────────────────────
  app.useWebSocketAdapter(new WsAdapter(app));

  // ── 4. ValidationPipe global ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── 5. Interceptors globales ───────────────────────────────────────────────
  app.useGlobalInterceptors(
    new ApiResponseInterceptor(new Reflector()),
    new SnakeCaseInterceptor(),
  );

  // ── 6. Filter global ───────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── 7. Graceful shutdown ───────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── 8. Arrancar ────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 8000;
  await app.listen(port);

  logger.log(
    `🚀  KOAJ Access API corriendo en http://localhost:${port}/api/v1`,
  );
  logger.log(`🌍  Entorno: ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`🔒  CORS habilitado para: ${allowedOrigins.join(', ')}`);
}

bootstrap();