import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateHealthProfessionalDto } from "./create-health-professional.dto";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { UpdateUserDto } from "src/modules/users/dtos/update-user.dto";

class HealthProfessionalDataOnly extends OmitType(CreateHealthProfessionalDto, [
  "user",
] as const) {}
export class UpdateHealthProfessionalDto extends PartialType(
  HealthProfessionalDataOnly,
) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  user?: UpdateUserDto;
}

export class LinkParticipantDto {
  @IsString()
  @IsNotEmpty()
  participantId: string;
}
