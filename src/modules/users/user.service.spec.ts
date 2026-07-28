import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ConflictException } from "@nestjs/common";
import { Prisma, SystemRole, User } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { CreateUserDto } from "./dtos/create-user.dto";

describe("UserService - unicidade e normalização de e-mail", () => {
  let userService: UserService;
  let prismaService: PrismaService;
  let createSpy: jest.SpyInstance;

  const mockUser: User = {
    id: "user-id",
    email: "maria@example.com",
    fullName: "Maria da Silva",
    fullName_normalized: "maria da silva",
    password: "hashed", // eslint-disable-line sonarjs/no-hardcoded-passwords
    active: true,
    role: "PARTICIPANT" as SystemRole,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    passwordResetUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    createSpy = jest.spyOn(prismaService.user, "create");
  });

  describe("createUser", () => {
    const dto = {
      fullName: "Maria da Silva",
      email: "maria@example.com",
      role: SystemRole.PARTICIPANT,
      password: "Secret123!", // eslint-disable-line sonarjs/no-hardcoded-passwords
    };

    it("should persist the email in lowercase to prevent case-variant duplicates (BUG-CT02)", async () => {
      createSpy.mockResolvedValue(mockUser);

      await userService.createUser({ ...dto, email: " Maria@Example.COM " });

      const createArgs = (createSpy.mock.calls[0] as unknown[])[0] as {
        data: { email: string };
      };
      expect(createArgs.data.email).toBe("maria@example.com");
    });

    it("should throw ConflictException with the standardized message on duplicate email (BUG-CT05)", async () => {
      createSpy.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "test",
          meta: { target: ["email"] },
        }),
      );

      await expect(userService.createUser(dto)).rejects.toThrow(
        new ConflictException("Este e-mail já está cadastrado no sistema."),
      );
    });
  });

  describe("CreateUserDto", () => {
    it("should normalize the email during transformation (BUG-CT02)", () => {
      const instance = plainToInstance(CreateUserDto, {
        fullName: "Maria da Silva",
        email: " Maria@Example.COM ",
        role: SystemRole.PARTICIPANT,
        password: "Secret123!", // eslint-disable-line sonarjs/no-hardcoded-passwords
      });

      expect(instance.email).toBe("maria@example.com");
    });
  });
});
