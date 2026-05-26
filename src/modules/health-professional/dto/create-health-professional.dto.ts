import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, Matches, ValidateNested } from "class-validator";
import { CreateUserDto } from "src/modules/users/dtos/create-user.dto";

export class CreateHealthProfessionalUserDto extends OmitType(CreateUserDto, [
  "role",
]) {}

export class CreateHealthProfessionalDto {
  @ValidateNested()
  @Type(() => CreateHealthProfessionalUserDto)
  @IsNotEmpty()
  user: CreateHealthProfessionalUserDto;

  @ApiProperty({
    description: "The speciality of the health professional",
    example: "Cardiologista",
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\s*\p{L}+(?:\s+\p{L}+)*\s*$/u, {
    message: "O vínculo deve conter apenas letras e espaços.",
  })
  speciality: string;
}
