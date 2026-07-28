import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class ClassifiedParticipantsQueryDto {
  @IsString()
  @IsNotEmpty()
  classification!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsIn(["score", "name", "age", "date"])
  orderBy?: string = "score";

  @IsOptional()
  @IsIn(["asc", "desc"])
  orderDirection?: string = "desc";

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
}
