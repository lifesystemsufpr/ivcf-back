import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ShareRequestService } from "./share-request.service";
import { CreateShareRequestDto } from "./dto/create-share-request.dto";
import { BatchShareRequestResponseDto } from "./dto/batch-share-request-response.dto";
import { ListShareRequestsQueryDto } from "./dto/list-share-requests.dto";
import type { ListShareRequestsResponseDto } from "./dto/list-share-requests.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequestUser } from "../auth/decorators/request-user.decorator";
import { SystemRole } from "@prisma/client";
import type { Payload } from "../auth/interfaces/auth.interface";

@ApiBearerAuth()
@Controller("share-requests")
export class ShareRequestController {
  constructor(private readonly service: ShareRequestService) {}

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Post()
  @ApiOperation({ summary: "Solicitar compartilhamento de bases históricas" })
  create(
    @RequestUser() user: Payload,
    @Body() dto: CreateShareRequestDto,
  ): Promise<BatchShareRequestResponseDto> {
    return this.service.create(user.id, dto);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get()
  @ApiOperation({ summary: "Listar solicitações de compartilhamento" })
  list(
    @RequestUser() user: Payload,
    @Query() query: ListShareRequestsQueryDto,
  ): Promise<ListShareRequestsResponseDto> {
    return this.service.list(user.id, query);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Patch(":id/approve")
  @ApiOperation({ summary: "Aprovar solicitação e copiar histórico" })
  approve(
    @RequestUser() user: Payload,
    @Param("id") id: string,
  ) {
    return this.service.approve(user.id, id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Patch(":id/reject")
  @ApiOperation({ summary: "Rejeitar solicitação de compartilhamento" })
  reject(
    @RequestUser() user: Payload,
    @Param("id") id: string,
  ) {
    return this.service.reject(user.id, id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancelar solicitação de compartilhamento" })
  cancel(
    @RequestUser() user: Payload,
    @Param("id") id: string,
  ) {
    return this.service.cancel(user.id, id);
  }
}
