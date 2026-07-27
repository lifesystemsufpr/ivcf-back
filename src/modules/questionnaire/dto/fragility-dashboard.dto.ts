import { Type } from "class-transformer";
import { IsDateString, IsIn, IsNumber, IsOptional } from "class-validator";

export class FragilityDashboardQueryDto {
  @IsOptional()
  @IsIn(["M", "F", "all"])
  sex?: "M" | "F" | "all";

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
}
