import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import type { Response } from "express";
import { QuestionnaireService } from "./questionnaire.service";
import { CreateResponseDto } from "./dto/create-response.dto";
import { FilterQuestionnaireResponseDto } from "./dto/filter-questionnaire-response.dto";
import { FilterParticipantDto } from "./dto/filter-participant.dto";
import { FragilityDashboardQueryDto } from "./dto/fragility-dashboard.dto";
import { ClassifiedParticipantsQueryDto } from "./dto/classified-participants-query.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { SystemRole } from "@prisma/client";
import { RequestUser } from "../auth/decorators/request-user.decorator";
import { Payload } from "../auth/interfaces/auth.interface";
import type {
  FragilityDashboardResponse,
  CurrentMonthStatsResponse,
  ParticipantEvolutionDailyData,
} from "./interfaces/ivcf-evolution.interface";

@Controller("questionnaires")
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @Get("ivcf-20")
  getStructure() {
    return this.service.getIvcfStructure();
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get()
  findAll(
    @RequestUser() user: Payload,
    @Query() query: FilterQuestionnaireResponseDto,
  ) {
    return this.service.findAll(query, user.id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Post("response")
  create(@RequestUser() user: Payload, @Body() dto: CreateResponseDto) {
    return this.service.createResponse({
      ...dto,
      healthProfessionalId: user.id,
    });
  }

  // A visão de detalhe do participante é escopada à base do profissional dono.
  // Para MANAGER (e demais papéis) mantém-se a visão global (sem escopo por base).
  private ownerScope(user: Payload): string | undefined {
    return user.role === SystemRole.HEALTH_PROFESSIONAL ? user.id : undefined;
  }

  @Get("participant/:participantId")
  getByParticipant(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
    @Query() query: FilterParticipantDto,
  ) {
    return this.service.findAllByParticipant(id, query, this.ownerScope(user));
  }

  @Get("participant/:participantId/evolution")
  getParticipantEvolution(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
  ) {
    return this.service.getParticipantEvolution(id, this.ownerScope(user));
  }

  @Get("participant/:participantId/evolution/daily")
  getParticipantEvolutionDaily(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
  ): Promise<ParticipantEvolutionDailyData> {
    return this.service.getParticipantEvolutionDaily(id, this.ownerScope(user));
  }

  @Get("participant/:participantId/summary")
  getParticipantSummary(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
  ) {
    return this.service.getParticipantSummary(id, this.ownerScope(user));
  }

  @Get("participant/:participantId/score-history")
  getScoreHistory(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
  ) {
    return this.service.getScoreHistory(id, this.ownerScope(user));
  }

  @Get("participant/:participantId/domain-history")
  getDomainHistory(
    @RequestUser() user: Payload,
    @Param("participantId") id: string,
  ) {
    return this.service.getDomainHistory(id, this.ownerScope(user));
  }

  @Get("participant/:participantId/assessment/:assessmentId")
  getAssessmentDetail(
    @RequestUser() user: Payload,
    @Param("participantId") participantId: string,
    @Param("assessmentId") assessmentId: string,
  ) {
    return this.service.getAssessmentDetail(
      participantId,
      assessmentId,
      this.ownerScope(user),
    );
  }

  @Get("response/:id")
  getOneResponse(@Param("id") id: string) {
    return this.service.findOneResponse(id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get("classified-participants")
  getClassifiedParticipants(
    @RequestUser() user: Payload,
    @Query() query: ClassifiedParticipantsQueryDto,
  ) {
    return this.service.findParticipantsByClassification(user.id, query);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get("dashboard")
  getFragilityDashboard(
    @RequestUser() user: Payload,
    @Query() query: FragilityDashboardQueryDto,
  ): Promise<FragilityDashboardResponse> {
    return this.service.getFragilityDashboard(user.id, query);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get("dashboard/export")
  async exportFragilityDashboardCsv(
    @RequestUser() user: Payload,
    @Query() query: FragilityDashboardQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const csv = await this.service.exportFragilityDashboardCsv(user.id, query);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `ivcf-dashboard-${date}.csv`;

    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    });

    return new StreamableFile(Buffer.from(csv, "utf8"));
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get("dashboard/current-month")
  getCurrentMonthStats(
    @RequestUser() user: Payload,
  ): Promise<CurrentMonthStatsResponse> {
    return this.service.getCurrentMonthStats(user.id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Post("responses/recompute")
  recomputeResponses() {
    return this.service.recomputeAllResponses();
  }
}
