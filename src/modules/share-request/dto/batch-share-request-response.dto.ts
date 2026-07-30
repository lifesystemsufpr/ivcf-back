import { ApiProperty } from "@nestjs/swagger";

class BatchItemResult {
  @ApiProperty()
  sourceHistoricoBaseId: string;

  @ApiProperty({ required: false })
  shareRequestId?: string;

  @ApiProperty({ required: false })
  reason?: string;
}

class BatchCounts {
  @ApiProperty()
  created: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  blocked: number;
}

export class BatchShareRequestResponseDto {
  @ApiProperty({ type: [BatchItemResult] })
  created: BatchItemResult[];

  @ApiProperty({ type: [BatchItemResult] })
  skipped: BatchItemResult[];

  @ApiProperty({ type: [BatchItemResult] })
  blocked: BatchItemResult[];

  @ApiProperty({ type: BatchCounts })
  counts: BatchCounts;
}
