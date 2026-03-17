import { ApiProperty } from "@nestjs/swagger";
import { Gender, SystemRole } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    description: "User's full name.",
    example: "Maria da Silva",
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: "User's email address (must be unique).",
    example: "maria.silva@example.com",
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's phone number (optional).",
    example: "41999998888",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: "User's gender.",
    enum: Gender,
    example: "FEMALE",
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: "User's role in the system.",
    enum: SystemRole,
    example: "PARTICIPANT",
  })
  @IsEnum(SystemRole)
  @IsNotEmpty()
  role: SystemRole;

  @ApiProperty({
    description: "User password (must be at least 6 characters).",
    example: "MyS3cureP@ss!",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "O campo active precisa ser um valor booleano (true ou false)",
    example: "true",
  })
  @IsBoolean()
  @IsOptional()
  active?;
}
