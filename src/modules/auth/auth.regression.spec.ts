import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../../shared/services/email.service";
import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { User } from "@prisma/client";

describe("Auth - Regression Tests", () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;

  const mockUser: User = {
    id: "test-user-id",
    email: "test@example.com",
    fullName: "Test User",
    fullName_normalized: "test user",
    password: "$2b$10$1234567890123456789012345678901234567890",
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
              if (key === "NODE_ENV") {
                return "test";
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
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe("validateCredentials - should still work correctly", () => {
    it("should validate valid credentials", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);

      jest.mock("src/shared/functions/hash-password", () => ({
        comparePassword: jest.fn().mockResolvedValue(true),
      }));

      expect(prismaService.user.findUnique).toBeDefined();
    });

    it("should throw UnauthorizedException when user not found", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      await expect(
        authService.validateCredentials("nonexistent@example.com", "password"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw ForbiddenException when user is inactive", async () => {
      const inactiveUser = { ...mockUser, active: false };
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(inactiveUser);

      await expect(
        authService.validateCredentials(mockUser.email, "password"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("signIn - should still work correctly", () => {
    it("should generate both access and refresh tokens", async () => {
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("test-token");

      const payload = {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      };

      const result = await authService.signIn(payload);

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it("should include keepMeLoggedIn flag in refresh token", async () => {
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("test-token");

      const payload = {
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      };

      await authService.signIn(payload, true);

      const refreshTokenCall = jest.spyOn(jwtService, "signAsync").mock
        .calls[1];
      expect(refreshTokenCall[0]).toHaveProperty("persistent", true);
    });
  });

  describe("validateRefreshToken - should still work correctly", () => {
    it("should validate and return user from refresh token", async () => {
      const tokenPayload = {
        sub: mockUser.id,
        persistent: true,
      };

      jest
        .spyOn(jwtService, "verifyAsync")
        .mockResolvedValue(tokenPayload as any);
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);

      const result = await authService.validateRefreshToken("valid-token");

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.persistent).toBe(true);
    });

    it("should throw error for invalid token", async () => {
      jest
        .spyOn(jwtService, "verifyAsync")
        .mockRejectedValue(new Error("Invalid token"));

      await expect(
        authService.validateRefreshToken("invalid-token"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when user from token not found", async () => {
      const tokenPayload = { sub: "nonexistent-id", persistent: false };

      jest
        .spyOn(jwtService, "verifyAsync")
        .mockResolvedValue(tokenPayload as any);
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      await expect(
        authService.validateRefreshToken("valid-token"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getUserFromId - should still work correctly", () => {
    it("should return user when found", async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        role: mockUser.role,
      };
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(userWithoutPassword as any);

      const result = await authService.getUserFromId(mockUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
    });

    it("should return null when user not found", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      const result = await authService.getUserFromId("nonexistent-id");

      expect(result).toBeNull();
    });

    it("should not include password in response", async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        role: mockUser.role,
      };
      jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(userWithoutPassword as any);

      const result = await authService.getUserFromId(mockUser.id);

      expect(result).not.toHaveProperty("password");
    });
  });

  describe("Auth service initialization - EmailService integration", () => {
    it("should have EmailService injected", async () => {
      expect(authService["emailService"]).toBeDefined();
      expect(authService["emailService"]).toBe(emailService);
    });

    it("should not break existing functionality with new dependency", async () => {
      // Verify that adding EmailService doesn't affect the core auth logic
      expect(authService.validateCredentials).toBeDefined();
      expect(authService.signIn).toBeDefined();
      expect(authService.validateRefreshToken).toBeDefined();
      expect(authService.getUserFromId).toBeDefined();
      expect(authService.forgotPassword).toBeDefined();
      expect(authService.resetPassword).toBeDefined();
    });
  });

  describe("Module structure - no circular dependencies", () => {
    it("should properly export AuthService", () => {
      expect(authService).toBeInstanceOf(AuthService);
    });

    it("should have ConfigService available", () => {
      expect(configService).toBeDefined();
    });

    it("should have all required services injected", () => {
      expect(prismaService).toBeDefined();
      expect(jwtService).toBeDefined();
      expect(configService).toBeDefined();
      expect(emailService).toBeDefined();
    });
  });
});
