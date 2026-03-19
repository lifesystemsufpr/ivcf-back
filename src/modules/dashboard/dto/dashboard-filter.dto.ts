import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { Gender } from "@prisma/client";

export class DashboardFilterDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ageMax?: number;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsIn(["sex", "ageGroup"])
  stratification?: "sex" | "ageGroup";

  @IsOptional()
  @IsString()
  riskClassification?: string;
}
