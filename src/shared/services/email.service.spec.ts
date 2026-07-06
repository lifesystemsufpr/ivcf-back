import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import { EmailService } from "./email.service";
import * as nodemailer from "nodemailer";

jest.mock("nodemailer");

describe("EmailService", () => {
  let emailService: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(() => ({
              smtpHost: "smtp.test",
              smtpPort: 587,
              smtpUser: "user",
              smtpPassword: "pass", // eslint-disable-line sonarjs/no-hardcoded-passwords
              fromAddress: "noreply@test.com",
              fromName: "Test",
            })),
          },
        },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  it("should send the password reset email", async () => {
    sendMailMock.mockResolvedValue({});

    await emailService.sendPasswordResetEmail(
      "user@test.com",
      "User Test",
      "http://localhost/reset-password?token=abc",
      15,
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@test.com" }),
    );
  });

  it("should propagate an error when the SMTP send fails (BUG-CT04)", async () => {
    sendMailMock.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(
      emailService.sendPasswordResetEmail(
        "user@test.com",
        "User Test",
        "http://localhost/reset-password?token=abc",
        15,
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
