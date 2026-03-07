import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "usuario@email.com" })
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
