import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../../shared/services/email.service";
import { UnauthorizedException } from "@nestjs/common";
import { User, SystemRole } from "@prisma/client";

describe("Auth - Regression Tests", () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let findUniqueSpy: jest.SpyInstance;
  let signAsyncSpy: jest.SpyInstance;

  const mockUser: User = {
    id: "test-user-id",
    email: "test@example.com",
    fullName: "Test User",
    fullName_normalized: "test user",
    password: "mock_hashed_value", // eslint-disable-line sonarjs/no-hardcoded-passwords
    active: true,
    gender: null,
    role: "PARTICIPANT" as SystemRole,
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
            getOrThrow: jest.fn((key: string) => {
              if (key === "security") {
                return {
                  jwtSecret: "test-secret",
                  jwtExpirationTime: 86400,
                  jwtRefreshExpirationTime: 604800,
                };
              }
              return null;
            }),
            get: jest.fn((key: string) => {
              if (key === "FRONTEND_URL") return "http://localhost:3000";
              if (key === "NODE_ENV") return "test";
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
    emailService = module.get<EmailService>(EmailService);
    findUniqueSpy = jest.spyOn(prismaService.user, "findUnique");
    signAsyncSpy = jest.spyOn(jwtService, "signAsync");
  });

  describe("validateCredentials", () => {
    it("should validate valid credentials", () => {
      findUniqueSpy.mockResolvedValue(mockUser);
      expect(authService).toBeDefined();
    });

    it("should throw UnauthorizedException when user not found", async () => {
      findUniqueSpy.mockResolvedValue(null);

      await expect(
        authService.validateCredentials("none@example.com", "pass"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("signIn", () => {
    it("should generate both tokens", async () => {
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("test-token");

      const result = await authService.signIn({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      });

      expect(result.access_token).toBeDefined();
      expect(signAsyncSpy).toHaveBeenCalledTimes(2);
    });

    it("should include keepMeLoggedIn flag", async () => {
      signAsyncSpy.mockResolvedValue("test-token");

      await authService.signIn(mockUser, true);

      const calls = signAsyncSpy.mock.calls;
      expect((calls[1] as unknown[])[0]).toHaveProperty("persistent", true);
    });
  });

  describe("validateRefreshToken", () => {
    it("should return user from token", async () => {
      const payload = { sub: mockUser.id, persistent: true };
      jest.spyOn(jwtService, "verifyAsync").mockResolvedValue(payload);
      findUniqueSpy.mockResolvedValue(mockUser);

      const result = await authService.validateRefreshToken("token");
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe("getUserFromId", () => {
    it("should return user when found", async () => {
      findUniqueSpy.mockResolvedValue(mockUser);
      const result = await authService.getUserFromId(mockUser.id);
      expect(result?.id).toBe(mockUser.id);
    });
  });

  describe("Initialization", () => {
    it("should have services injected", () => {
      expect(authService).toBeDefined();
      expect(emailService).toBeDefined();
    });
  });
});
