import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { Gender } from "@prisma/client";

export class DashboardFilterDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAge?: number;

  @IsOptional()
  @IsString()
  riskClassification?: string;
}
