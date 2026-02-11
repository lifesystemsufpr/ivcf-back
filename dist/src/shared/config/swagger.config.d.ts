import { INestApplication } from "@nestjs/common";
import { SwaggerConfig } from "./config.interface";
export declare const setupSwagger: (app: INestApplication, swaggerConfig: SwaggerConfig) => void;
