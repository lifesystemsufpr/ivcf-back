import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListShareRequestsQueryDto {
  @ApiProperty({ enum: ["owner", "requester"] })
  @IsString()
  @IsIn(["owner", "requester"])
  as: "owner" | "requester";

  @ApiPropertyOptional({ enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] })
  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class ShareRequestItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  participantId: string;

  @ApiProperty()
  participantName: string;

  @ApiProperty()
  ownerProfessionalId: string;

  @ApiProperty()
  ownerName: string;

  @ApiProperty()
  requesterProfessionalId: string;

  @ApiProperty()
  requesterName: string;

  @ApiProperty()
  sourceHistoricoBaseId: string;

  @ApiProperty({ required: false })
  targetHistoricoBaseId?: string;

  @ApiProperty()
  snapshotAt: string;

  @ApiProperty()
  requestedAt: string;

  @ApiProperty({ required: false })
  respondedAt?: string;
}

export class ListShareRequestsResponseDto {
  @ApiProperty({ type: [ShareRequestItemDto] })
  data: ShareRequestItemDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
