import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateShareRequestDto {
  @ApiProperty({
    description: "ID do participante cujo histórico será compartilhado",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  participantId: string;

  @ApiProperty({
    description: "IDs das bases históricas de origem (1..N donos diferentes)",
    example: [
      "660e8400-e29b-41d4-a716-446655440001",
      "770e8400-e29b-41d4-a716-446655440002",
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  sourceHistoricoBaseIds: string[];
}
