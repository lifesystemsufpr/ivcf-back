import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccessToken, JwtPayload, Payload } from "./interfaces/auth.interface";
import { User } from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";
import {
  comparePassword,
  hashPassword,
} from "src/shared/functions/hash-password";
import { ConfigService } from "@nestjs/config";
import {
  SecurityConfig,
  PasswordRecoveryConfig,
} from "src/shared/config/config.interface";
import { EmailService } from "src/shared/services/email.service";
import { createHash, randomBytes } from "crypto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          password: true,
          active: true,
        },
      });

      if (!user || user.active === false) {
        throw new UnauthorizedException("Credenciais inválidas");
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException("Credenciais inválidas");
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error("Erro ao validar credenciais", error as Error);
      throw new InternalServerErrorException(
        "Ocorreu um erro ao validar o acesso",
      );
    }
  }

  async signIn(
    user: Payload,
    keepMeLoggedIn: boolean = false,
  ): Promise<AccessToken> {
    const securityConfig =
      this.configService.getOrThrow<SecurityConfig>("security");

    const payload: Record<string, any> = {
      username: user.fullName,
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const refreshPayload: Record<string, string | boolean> = {
      sub: user.id,
      persistent: keepMeLoggedIn,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: securityConfig.jwtSecret,
        expiresIn: securityConfig.jwtExpirationTime,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: securityConfig.jwtSecret,
        expiresIn: securityConfig.jwtRefreshExpirationTime,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async validateRefreshToken(
    token: string,
  ): Promise<{ user: Payload; persistent: boolean }> {
    const securityConfig =
      this.configService.getOrThrow<SecurityConfig>("security");

    const refreshSecret = securityConfig.jwtSecret;

    try {
      type RefreshPayload = Pick<JwtPayload, "sub"> & { persistent?: boolean };

      const payload = await this.jwtService.verifyAsync<RefreshPayload>(token, {
        secret: refreshSecret,
      });

      const user = await this.getUserFromId(payload.sub);
      if (!user) {
        throw new UnauthorizedException("Usuário do token não encontrado");
      }

      return {
        user: user,
        persistent: payload.persistent ?? false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn("Token de refresh inválido", message);
      throw new UnauthorizedException("Token de refresh inválido ou expirado");
    }
  }

  async getUserFromId(id: string): Promise<Payload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return;
    }

    const passwordRecoveryConfig =
      this.configService.getOrThrow<PasswordRecoveryConfig>(
        "passwordRecovery",
      );

    const resetToken = this.generateResetToken();
    const resetTokenHash = this.hashResetToken(resetToken);
    const expiresAt = new Date(
      Date.now() + passwordRecoveryConfig.tokenExpiryMinutes * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiresAt: expiresAt,
        passwordResetUsedAt: null,
      },
    });

    const resetLink = `${passwordRecoveryConfig.frontendBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetLink,
      passwordRecoveryConfig.tokenExpiryMinutes,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetTokenHash = this.hashResetToken(token);
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: resetTokenHash },
    });

    if (!user || !user.passwordResetToken) {
      throw new BadRequestException("Token inválido ou expirado.");
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException("Token inválido ou expirado.");
    }

    if (user.passwordResetUsedAt) {
      throw new BadRequestException("Token de recuperação já foi utilizado.");
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        passwordResetUsedAt: new Date(),
      },
    });
  }

  private generateResetToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashResetToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
