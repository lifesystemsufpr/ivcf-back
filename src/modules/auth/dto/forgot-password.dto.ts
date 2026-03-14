import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class ForgotPasswordDto {
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
