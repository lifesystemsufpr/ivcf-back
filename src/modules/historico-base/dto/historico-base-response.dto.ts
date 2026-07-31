import { ApiProperty } from "@nestjs/swagger";

class BaseOwnerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  specialty: string;
}

class HistoricoBaseItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ["FROM_SCRATCH", "COPIED"] })
  origin: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  responsesCount: number;

  @ApiProperty()
  isCurrentUserOwner: boolean;

  @ApiProperty({ type: BaseOwnerDto })
  owner: BaseOwnerDto;
}

export class HistoricoBaseListResponseDto {
  @ApiProperty()
  hasOwnBase: boolean;

  @ApiProperty({ type: [HistoricoBaseItemDto] })
  bases: HistoricoBaseItemDto[];
}

export class HistoricoBaseCreateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ["FROM_SCRATCH", "COPIED"] })
  origin: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  participantId: string;

  @ApiProperty()
  ownerProfessionalId: string;

  @ApiProperty()
  createdAt: string;
}
