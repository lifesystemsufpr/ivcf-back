import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from "class-validator";
import { normalizeEmail } from "src/shared/functions/normalize-email";

export class LoginDto {
  @ApiProperty({ example: "usuario@email.com" })
  @Transform(({ value }) => normalizeEmail(value as string))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "Marcar para manter o usuário logado por 7 dias",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  keepMeLoggedIn?: boolean;
}
