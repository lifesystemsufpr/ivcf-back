import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

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
}
