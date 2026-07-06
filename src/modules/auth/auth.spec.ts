import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../../shared/services/email.service";
import { BadRequestException } from "@nestjs/common";
import { User, SystemRole } from "@prisma/client";
import { createHash } from "crypto";

describe("Auth - Password Recovery", () => {
  let authService: AuthService;
  let authController: AuthController;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let sendPasswordResetEmailSpy: jest.SpyInstance;
  let findUniqueSpy: jest.SpyInstance;
  let findFirstSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;

  const mockUser: User = {
    id: "test-user-id",
    email: "test@example.com",
    fullName: "Test User",
    fullName_normalized: "test user",
    password: "mock_hashed_value", // eslint-disable-line sonarjs/no-hardcoded-passwords
    active: true,
    role: "PARTICIPANT" as SystemRole,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    passwordResetUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const hashToken = (token: string): string =>
    createHash("sha256").update(token).digest("hex");

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === "security") return { jwtSecret: "secret" };
              if (key === "email")
                return { fromAddress: "a@a.com", fromName: "T" };
              if (key === "passwordRecovery")
                return {
                  frontendBaseUrl: "http://localhost:3000",
                  tokenExpiryMinutes: 15,
                };
              return null;
            }),
            get: jest.fn((key: string) => {
              if (key === "FRONTEND_URL") return "http://localhost:3000";
              return null;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    sendPasswordResetEmailSpy = jest.spyOn(
      emailService,
      "sendPasswordResetEmail",
    );
    findUniqueSpy = jest.spyOn(prismaService.user, "findUnique");
    findFirstSpy = jest.spyOn(prismaService.user, "findFirst");
    updateSpy = jest.spyOn(prismaService.user, "update");
  });

  describe("forgotPassword", () => {
    it("should send email with a 15 minute expiry when user exists", async () => {
      findUniqueSpy.mockResolvedValue(mockUser);
      updateSpy.mockResolvedValue(mockUser);

      const before = Date.now();
      await authService.forgotPassword(mockUser.email);
      const after = Date.now();

      expect(sendPasswordResetEmailSpy).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.fullName,
        expect.stringContaining("/reset-password?token="),
        15,
      );

      const updateArgs = (updateSpy.mock.calls[0] as unknown[])[0] as {
        data: { passwordResetToken: string; passwordResetExpiresAt: Date };
      };
      const expiresAt = updateArgs.data.passwordResetExpiresAt.getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 15 * 60 * 1000);
    });

    it("should store a hashed token, never the raw token", async () => {
      findUniqueSpy.mockResolvedValue(mockUser);
      updateSpy.mockResolvedValue(mockUser);

      await authService.forgotPassword(mockUser.email);

      const resetLink = (
        sendPasswordResetEmailSpy.mock.calls[0] as unknown[]
      )[2] as string;
      const rawToken = decodeURIComponent(resetLink.split("token=")[1]);
      const updateArgs = (updateSpy.mock.calls[0] as unknown[])[0] as {
        data: { passwordResetToken: string };
      };

      expect(updateArgs.data.passwordResetToken).not.toBe(rawToken);
      expect(updateArgs.data.passwordResetToken).toBe(hashToken(rawToken));
    });

    it("should normalize the email (trim + lowercase) before lookup", async () => {
      findUniqueSpy.mockResolvedValue(mockUser);
      updateSpy.mockResolvedValue(mockUser);

      await authService.forgotPassword("  Test@Example.COM  ");

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should do nothing when user does not exist", async () => {
      findUniqueSpy.mockResolvedValue(null);

      await authService.forgotPassword("none@example.com");

      expect(sendPasswordResetEmailSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    const rawToken = "raw-reset-token";

    it("should update password when token is valid and not expired", async () => {
      findFirstSpy.mockResolvedValue({
        ...mockUser,
        passwordResetToken: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        passwordResetUsedAt: null,
      });
      updateSpy.mockResolvedValue(mockUser);

      await authService.resetPassword(rawToken, "NewPass123!");

      const updateArgs = (updateSpy.mock.calls[0] as unknown[])[0] as {
        where: { id: string };
        data: {
          passwordResetToken: string | null;
          passwordResetExpiresAt: Date | null;
        };
      };
      expect(updateArgs.where.id).toBe(mockUser.id);
      expect(updateArgs.data.passwordResetToken).toBeNull();
      expect(updateArgs.data.passwordResetExpiresAt).toBeNull();
    });

    it("should reject an expired token (BUG-CT03)", async () => {
      findFirstSpy.mockResolvedValue({
        ...mockUser,
        passwordResetToken: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() - 60 * 1000),
        passwordResetUsedAt: null,
      });

      await expect(
        authService.resetPassword(rawToken, "NewPass123!"),
      ).rejects.toThrow(new BadRequestException("Token inválido ou expirado."));
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("should reject a token that was already used", async () => {
      findFirstSpy.mockResolvedValue({
        ...mockUser,
        passwordResetToken: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        passwordResetUsedAt: new Date(),
      });

      await expect(
        authService.resetPassword(rawToken, "NewPass123!"),
      ).rejects.toThrow(BadRequestException);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("should reject an unknown token", async () => {
      findFirstSpy.mockResolvedValue(null);

      await expect(
        authService.resetPassword("bad-token", "NewPass123!"),
      ).rejects.toThrow(BadRequestException);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Integrity Check", () => {
    it("should initialize services", () => {
      expect(authService).toBeDefined();
      expect(authController).toBeDefined();
    });
  });
});
