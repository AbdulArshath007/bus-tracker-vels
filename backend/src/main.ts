// ─── main.ts ─────────────────────────────────────────────────────────────────
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  const cs = app.get(ConfigService);
  const port = cs.get<number>('app.port') ?? 3000;
  const nodeEnv = cs.get<string>('app.nodeEnv');
  const corsOrigins = cs.get<string[]>('app.corsOrigins');

  // ── Security headers via Helmet ────────────────────────────────────────
  app.use(
    (helmet as any).default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production' ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix('v1');

  // ── Swagger (disabled in production) ───────────────────────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Vels Bus Tracker API')
      .setDescription('Shared backend API for Student App, Driver App, and Admin Portal')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log(`Swagger: http://localhost:${port}/docs`);
  }

  // ── Shutdown hooks ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Backend running on port ${port} (${nodeEnv})`);
}

bootstrap();
