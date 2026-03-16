export interface AppConfig {
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  security: SecurityConfig;
  email: EmailConfig;
}

export interface NestConfig {
  port: number;
  environment: string;
  httpsEnabled?: boolean;
  sslKeyPath?: string;
  sslCertPath?: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpirationTime: number;
  jwtRefreshExpirationTime: number;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
}

export interface CorsConfig {
  enabled: boolean;
  corsOrigins: boolean | string[] | string;
}

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
  enabled: boolean;
  useGlobalPrefix: boolean;
}
