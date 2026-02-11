"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_1 = require("@nestjs/swagger");
const setupSwagger = (app, swaggerConfig) => {
    const documentOptions = new swagger_1.DocumentBuilder()
        .setTitle(swaggerConfig.title)
        .setDescription(swaggerConfig.description)
        .setVersion(swaggerConfig.version)
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, documentOptions);
    const customOptions = {
        yamlDocumentUrl: swaggerConfig.path + "/export",
        raw: ["yaml"],
    };
    swagger_1.SwaggerModule.setup(swaggerConfig.path, app, document, customOptions);
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.config.js.map