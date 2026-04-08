import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";
import { Scholarship, SocialEconomicLevel } from "@prisma/client";
import { QueryDto } from "src/shared/dto/query.dto";

export enum ParticipantSortField {
  FULL_NAME = "fullName",
  EMAIL = "email",
  CITY = "city",
  STATE = "state",
  NEIGHBORHOOD = "neighborhood",
  BIRTHDAY = "birthday",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export class FindParticipantQueryDto extends QueryDto {
  @IsOptional()
  @IsEnum(ParticipantSortField)
  sortField?: ParticipantSortField;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.ASC;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) {
      return true;
    }

    if (value === "false" || value === false) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthday?: Date;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @IsOptional()
  @IsEnum(Scholarship)
  scholarship?: Scholarship;

  @IsOptional()
  @IsEnum(SocialEconomicLevel)
  socio_economic_level?: SocialEconomicLevel;
}
