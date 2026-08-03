"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const config = app.get(config_1.ConfigService);
    const logger = new common_1.Logger('Bootstrap');
    app.use((0, helmet_1.default)());
    app.set('trust proxy', 1);
    const server = app.getHttpServer();
    server.requestTimeout = 30_000;
    server.headersTimeout = 35_000;
    server.keepAliveTimeout = 5_000;
    const origins = (config.get('CORS_ORIGINS') ?? 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim());
    app.enableCors({
        origin: origins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor(), new logging_interceptor_1.LoggingInterceptor());
    const isProduction = config.get('NODE_ENV') === 'production';
    if (!isProduction) {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Sistema de Repuestos API')
            .setDescription('API de inventarios, control de precios y facturación para comercialización de repuestos. ' +
            'Autenticación: Bearer token (access). Para rotar sesión use /api/auth/refresh.')
            .setVersion('1.0.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    const port = config.get('PORT', 3000);
    await app.listen(port, '0.0.0.0');
    logger.log(`API corriendo en http://localhost:${port}/api`);
    if (!isProduction) {
        logger.log(`Swagger en http://localhost:${port}/api/docs`);
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map