import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../../shared/services/email.service";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { User } from "@prisma/client";

describe("Auth - Password Recovery", () => {
  let authService: AuthService;
  let authController: AuthController;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;

  const mockUser: User = {
    id: "test-user-id",
    email: "test@example.com",
    fullName: "Test User",
    fullName_normalized: "test user",
    password: "$2b$10$hashedpassword",
    active: true,
    gender: null,
    role: "PARTICIPANT" as any,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
            getOrThrow: jest.fn((key) => {
              if (key === "security") {
                return {
                  jwtSecret: "test-secret",
                  jwtExpirationTime: 86400,
                  jwtRefreshExpirationTime: 604800,
                };
              }
              return null;
            }),
            get: jest.fn((key) => {
              if (key === "FRONTEND_URL") {
                return "http://localhost:3000";
              }
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
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe("forgotPassword", () => {
    it("should send password reset email when user exists", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("test-token");
      jest
        .spyOn(emailService, "sendPasswordResetEmail")
        .mockResolvedValue(undefined);

      await authService.forgotPassword(mockUser.email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.fullName,
        expect.stringContaining("reset-password"),
      );
    });

    it("should not throw error when user does not exist (security measure)", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      await expect(
        authService.forgotPassword("nonexistent@example.com"),
      ).resolves.not.toThrow();
      expect(prismaService.user.findUnique).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should generate reset link with correct format", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("test-reset-token");
      jest
        .spyOn(emailService, "sendPasswordResetEmail")
        .mockResolvedValue(undefined);

      await authService.forgotPassword(mockUser.email);

      const capturedCall = jest.spyOn(emailService, "sendPasswordResetEmail")
        .mock.calls[0];
      expect(capturedCall[2]).toContain("http://localhost:3000");
      expect(capturedCall[2]).toContain("reset-password");
      expect(capturedCall[2]).toContain("token=test-reset-token");
    });
  });

  describe("resetPassword", () => {
    it("should update password when token is valid", async () => {
      const newPassword = "NewSecurePassword123";
      const hashedPassword = "$2b$10$newhash";

      jest
        .spyOn(jwtService, "decode")
        .mockReturnValue({ sub: mockUser.id } as any);
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(jwtService, "verifyAsync").mockResolvedValue({} as any);

      // Mock hashPassword
      jest.mock("src/shared/functions/hash-password", () => ({
        hashPassword: jest.fn().mockResolvedValue(hashedPassword),
      }));

      jest
        .spyOn(prismaService.user, "update")
        .mockResolvedValue({ ...mockUser, password: hashedPassword });

      await authService.resetPassword("valid-token", newPassword);

      expect(jwtService.decode).toHaveBeenCalledWith("valid-token");
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(jwtService.verifyAsync).toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it("should throw error when token is malformed", async () => {
      jest.spyOn(jwtService, "decode").mockReturnValue(null);

      await expect(
        authService.resetPassword("malformed-token", "NewPassword123"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error when user not found", async () => {
      jest.spyOn(jwtService, "decode").mockReturnValue({ sub: "invalid-id" });
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      await expect(
        authService.resetPassword("valid-token", "NewPassword123"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error when token verification fails", async () => {
      jest
        .spyOn(jwtService, "decode")
        .mockReturnValue({ sub: mockUser.id } as any);
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, "verifyAsync")
        .mockRejectedValue(new Error("Token expired"));

      await expect(
        authService.resetPassword("expired-token", "NewPassword123"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Controller - forgotPassword endpoint", () => {
    it("should return success message after forgotPassword", async () => {
      jest.spyOn(authService, "forgotPassword").mockResolvedValue(undefined);

      const result = await authController.forgotPassword({
        email: mockUser.email,
      });

      expect(result.message).toContain("Se o e-mail estiver cadastrado");
      expect(authService.forgotPassword).toHaveBeenCalledWith(mockUser.email);
    });

    it("should return generic message for non-existent email (security)", async () => {
      jest.spyOn(authService, "forgotPassword").mockResolvedValue(undefined);

      const result = await authController.forgotPassword({
        email: "nonexistent@example.com",
      });

      expect(result.message).toContain("Se o e-mail estiver cadastrado");
    });
  });

  describe("Controller - resetPassword endpoint", () => {
    it("should return success message after resetPassword", async () => {
      jest.spyOn(authService, "resetPassword").mockResolvedValue(undefined);

      const result = await authController.resetPassword({
        token: "valid-token",
        newPassword: "NewPassword123",
      });

      expect(result.message).toContain("Senha redefinida com sucesso");
      expect(authService.resetPassword).toHaveBeenCalledWith(
        "valid-token",
        "NewPassword123",
      );
    });

    it("should handle invalid token", async () => {
      jest
        .spyOn(authService, "resetPassword")
        .mockRejectedValue(new BadRequestException("Token inválido"));

      await expect(
        authController.resetPassword({
          token: "invalid-token",
          newPassword: "NewPassword123",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Email Service", () => {
    let emailServiceInstance: EmailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              getOrThrow: jest.fn((key) => {
                if (key === "email") {
                  return {
                    smtpHost: "smtp.gmail.com",
                    smtpPort: 587,
                    smtpUser: "test@gmail.com",
                    smtpPassword: "password",
                    fromAddress: "noreply@tecnoaging.com",
                    fromName: "TecnoAging",
                  };
                }
                return null;
              }),
            },
          },
        ],
      }).compile();

      emailServiceInstance = module.get<EmailService>(EmailService);
    });

    it("should have sendPasswordResetEmail method", () => {
      expect(emailServiceInstance.sendPasswordResetEmail).toBeDefined();
    });
  });
});
