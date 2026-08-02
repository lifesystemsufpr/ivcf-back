import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserModule } from "../users/user.module";
import { LocalStrategy } from "./strategy/local.strategy";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SecurityConfig } from "src/shared/config/config.interface";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { AuthController } from "./auth.controller";
import { SharedModule } from "src/shared/shared.module";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  providers: [AuthService, LocalStrategy, JwtStrategy],
  imports: [
    UserModule,
    SharedModule,
    PassportModule,
    // Rate limit dedicado ao módulo de auth (não afeta o resto da API).
    // Fallback de 10 req/min por IP; cada rota refina via @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 10 }],
      errorMessage:
        "Muitas requisições. Aguarde um instante e tente novamente.",
    }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        const securityConfig = config.getOrThrow<SecurityConfig>("security");
        return {
          secret: securityConfig.jwtSecret,
          signOptions: { expiresIn: Number(securityConfig.jwtExpirationTime) },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
