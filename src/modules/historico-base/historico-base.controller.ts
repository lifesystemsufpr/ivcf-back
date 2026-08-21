import { Controller, Get, Post, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { HistoricoBaseService } from "./historico-base.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequestUser } from "../auth/decorators/request-user.decorator";
import { SystemRole } from "@prisma/client";
import type { Payload } from "../auth/interfaces/auth.interface";
import type {
  HistoricoBaseListResponseDto,
  HistoricoBaseCreateResponseDto,
} from "./dto/historico-base-response.dto";

@ApiBearerAuth()
@Controller("participants/:participantId/historico-bases")
export class HistoricoBaseController {
  constructor(private readonly service: HistoricoBaseService) {}

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get()
  @ApiOperation({ summary: "Listar bases históricas ativas de um participante" })
  list(
    @RequestUser() user: Payload,
    @Param("participantId", ParseUUIDPipe) participantId: string,
  ): Promise<HistoricoBaseListResponseDto> {
    return this.service.list(user.id, participantId);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Post()
  @ApiOperation({ summary: "Criar uma nova base histórica (FROM_SCRATCH)" })
  create(
    @RequestUser() user: Payload,
    @Param("participantId", ParseUUIDPipe) participantId: string,
  ): Promise<HistoricoBaseCreateResponseDto> {
    return this.service.create(user.id, participantId);
  }
}
