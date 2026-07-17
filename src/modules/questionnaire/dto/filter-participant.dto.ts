import { IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class FilterParticipantDto {
  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
