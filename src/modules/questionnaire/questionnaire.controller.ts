import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { QuestionnaireService } from "./questionnaire.service";
import { CreateResponseDto } from "./dto/create-response.dto";
import { FilterQuestionnaireResponseDto } from "./dto/filter-questionnaire-response.dto";

@Controller("questionnaires")
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @Get("ivcf-20")
  getStructure() {
    return this.service.getIvcfStructure();
  }

  @Get()
  findAll(@Query() query: FilterQuestionnaireResponseDto) {
    return this.service.findAll(query);
  }

  @Post("response")
  create(@Body() dto: CreateResponseDto) {
    return this.service.createResponse(dto);
  }

  @Get("participant/:participantId")
  getByParticipant(@Param("participantId") id: string) {
    return this.service.findAllByParticipant(id);
  }

  @Get("participant/:participantId/evolution")
  getParticipantEvolution(@Param("participantId") id: string) {
    return this.service.getParticipantEvolution(id);
  }

  @Get("participant/:participantId/summary")
  getParticipantSummary(@Param("participantId") id: string) {
    return this.service.getParticipantSummary(id);
  }

  @Get("participant/:participantId/score-history")
  getScoreHistory(@Param("participantId") id: string) {
    return this.service.getScoreHistory(id);
  }

  @Get("participant/:participantId/domain-history")
  getDomainHistory(@Param("participantId") id: string) {
    return this.service.getDomainHistory(id);
  }

  @Get("participant/:participantId/assessment/:assessmentId")
  getAssessmentDetail(
    @Param("participantId") participantId: string,
    @Param("assessmentId") assessmentId: string,
  ) {
    return this.service.getAssessmentDetail(participantId, assessmentId);
  }

  @Get("response/:id")
  getOneResponse(@Param("id") id: string) {
    return this.service.findOneResponse(id);
  }
}
