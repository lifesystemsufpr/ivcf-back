import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../../shared/services/email.service";
import { BadRequestException } from "@nestjs/common";
import { User, SystemRole } from "@prisma/client";

describe("Auth - Password Recovery", () => {
  let authService: AuthService;
  let authController: AuthController;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let sendPasswordResetEmailSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;

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
              if (key === "security") return { jwtSecret: "secret" };
              if (key === "email")
                return { fromAddress: "a@a.com", fromName: "T" };
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
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    sendPasswordResetEmailSpy = jest.spyOn(
      emailService,
      "sendPasswordResetEmail",
    );
    updateSpy = jest.spyOn(prismaService.user, "update");
  });

  describe("forgotPassword", () => {
    it("should send email when user exists", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("token");

      await authService.forgotPassword(mockUser.email);

      expect(sendPasswordResetEmailSpy).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should update password when token is valid", async () => {
      jest.spyOn(jwtService, "decode").mockReturnValue({ sub: mockUser.id });
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, "verifyAsync")
        .mockResolvedValue({ sub: mockUser.id });

      await authService.resetPassword("token", "NewPass123!");

      expect(updateSpy).toHaveBeenCalled();
    });

    it("should throw error on malformed token", async () => {
      jest.spyOn(jwtService, "decode").mockReturnValue(null);

      await expect(
        authService.resetPassword("bad", "Pass123!"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Integrity Check", () => {
    it("should initialize services", () => {
      expect(authService).toBeDefined();
      expect(authController).toBeDefined();
    });
  });
});
