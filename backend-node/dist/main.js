"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_ws_1 = require("@nestjs/platform-ws");
const app_module_1 = require("./app.module");
const api_response_interceptor_1 = require("./common/interceptors/api-response.interceptor");
const snake_case_interceptor_1 = require("./common/interceptors/snake-case.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.setGlobalPrefix('api/v1');
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        ...(process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
            : []),
    ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS: origen no permitido → ${origin}`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Total-Count'],
        credentials: true,
        maxAge: 86400,
    });
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalInterceptors(new api_response_interceptor_1.ApiResponseInterceptor(new core_1.Reflector()), new snake_case_interceptor_1.SnakeCaseInterceptor());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableShutdownHooks();
    const port = process.env.PORT ?? 8000;
    await app.listen(port);
    logger.log(`🚀  KOAJ Access API corriendo en http://localhost:${port}/api/v1`);
    logger.log(`🌍  Entorno: ${process.env.NODE_ENV ?? 'development'}`);
    logger.log(`🔒  CORS habilitado para: ${allowedOrigins.join(', ')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map