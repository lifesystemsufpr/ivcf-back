"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_module_1 = require("./app.module");
const express_1 = require("express");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_config_1 = require("./shared/config/swagger.config");
const core_1 = require("@nestjs/core");
const prisma_client_exception_filter_1 = require("./shared/prisma/filters/prisma-client-exception.filter");
const cookieParser = require("cookie-parser");
const normalization_pipe_1 = require("./shared/pipes/normalization.pipe");
const core_2 = require("@nestjs/core");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix("backend");
    const logger = new common_1.Logger("AppInitializer");
    app.use((0, express_1.json)({ limit: "50mb" }));
    app.use((0, express_1.urlencoded)({ limit: "50mb", extended: true }));
    app.use(cookieParser());
    logger.log("Starting application...");
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }), new normalization_pipe_1.NormalizationPipe());
    const { httpAdapter } = app.get(core_2.HttpAdapterHost);
    app.useGlobalFilters(new prisma_client_exception_filter_1.PrismaClientExceptionFilter(httpAdapter));
    app.enableShutdownHooks();
    const appConfigService = app.get(config_1.ConfigService);
    const nestConfig = appConfigService.getOrThrow("nest");
    const corsConfig = appConfigService.getOrThrow("cors");
    const swaggerConfig = appConfigService.getOrThrow("swagger");
    logger.log("Configs loaded...");
    if (swaggerConfig.enabled) {
        logger.log("Swagger enabled");
        (0, swagger_config_1.setupSwagger)(app, swaggerConfig);
    }
    if (corsConfig.enabled) {
        logger.log("CORS enabled");
        app.enableCors({
            origin: [
                corsConfig.corsOrigins,
                "http://localhost:3000",
                "https://localhost:3000",
                "https://*.vercel.app",
                "https://tecnoaging-front.vercel.app",
            ],
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            allowedHeaders: "Content-Type, Accept, Authorization, X-Requested-With",
            credentials: true,
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
    }
    else {
        logger.log("CORS enabled (default)");
        app.enableCors({
            origin: [
                "http://localhost:3000",
                "https://localhost:3000",
                "https://*.vercel.app",
                "https://tecnoaging-front.vercel.app",
            ],
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            allowedHeaders: "Content-Type, Accept, Authorization, X-Requested-With",
            credentials: true,
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
    }
    const port = Number(nestConfig.port) || 3333;
    await app.listen(port, "127.0.0.1");
    logger.log(`[${nestConfig.environment}] Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
    console.error("Error starting application:", err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map