import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { normalizeEmail } from "src/shared/functions/normalize-email";

export class ForgotPasswordDto {
  @Transform(({ value }) => normalizeEmail(value as string))
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  newPassword: string;
}
