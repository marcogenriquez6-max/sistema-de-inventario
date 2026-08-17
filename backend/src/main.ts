import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // --- Seguridad ---
  app.use(helmet());
  // IP del cliente correcta detrás de reverse proxies (para throttling/logs).
  app.set('trust proxy', 1);
  // Timeouts de servidor contra slowloris y conexiones lentas.
  const server = app.getHttpServer();
  server.requestTimeout = 120_000;
  server.headersTimeout = 125_000;
  server.keepAliveTimeout = 65_000;

  // CORS restringido a orígenes configurados.
  const origins = (
    config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Prefijo global /api.
  app.setGlobalPrefix('api');

  // Archivos subidos (fotos de productos) servidos bajo /api/uploads/.
  const uploadsDir = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/api/uploads/' });

  // Validación estricta de DTOs en toda la aplicación.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Filtro global de errores + interceptores globales.
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // --- Swagger / OpenAPI (solo fuera de producción) ---
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sistema de Repuestos API')
      .setDescription(
        'API de inventarios, control de precios y facturación para comercialización de repuestos. ' +
          'Autenticación: Bearer token (access). Para rotar sesión use /api/auth/refresh.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`API corriendo en http://localhost:${port}/api`);
  if (!isProduction) {
    logger.log(`Swagger en http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
