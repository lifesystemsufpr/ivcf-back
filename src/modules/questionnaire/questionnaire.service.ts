import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateResponseDto } from "./dto/create-response.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { FilterQuestionnaireResponseDto } from "./dto/filter-questionnaire-response.dto";
import { Gender, Prisma } from "@prisma/client";
import { normalizeString } from "src/shared/functions/normalize-string";
import { FragilityDashboardQueryDto } from "./dto/fragility-dashboard.dto";
import type {
  IvcfDomainScores,
  IvcfAssessment,
  FragilityDashboardResponse,
  CurrentMonthStatsResponse,
  ParticipantEvolutionResponse,
  ParticipantSummaryResponse,
  ScoreHistoryResponse,
  DomainHistoryResponse,
  AssessmentDetailResponse,
  FragilityAssessmentRow,
} from "./interfaces/ivcf-evolution.interface";

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) { }

  private static readonly DOMAIN_LABELS: Record<keyof IvcfDomainScores, string> =
    {
      age: "Idade",
      selfPerception: "Autopercepção da Saúde",
      functionalCapacity: "Capacidade Funcional",
      cognition: "Cognição",
      mood: "Humor",
      mobility: "Mobilidade",
      communication: "Comunicação",
      comorbidities: "Comorbidades",
    };

  async getIvcfStructure() {
    return await this.prisma.questionnaire.findUnique({
      where: { slug: "ivcf-20" },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: { orderBy: { order: "asc" } },
              },
            },
            subGroups: {
              include: {
                questions: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async createResponse(dto: CreateResponseDto) {
    const optionIds = dto.answers
      .filter((a) => a.selectedOptionId)
      .map((a) => a.selectedOptionId);

    const selectedOptions = await this.prisma.questionOption.findMany({
      where: { id: { in: optionIds as string[] } },
      include: {
        question: {
          include: {
            group: true,
            subGroup: {
              include: { group: true },
            },
          },
        },
      },
    });

    if (selectedOptions.length === 0) {
      throw new NotFoundException("Nenhuma opção válida encontrada.");
    }

    const scoresByGroup: Record<string, { score: number; order: number }> = {};

    for (const option of selectedOptions) {
      const group = option.question.group || option.question.subGroup?.group;

      if (group) {
        if (!scoresByGroup[group.id]) {
          scoresByGroup[group.id] = { score: 0, order: group.order };
        }
        scoresByGroup[group.id].score += option.score;
      }
    }

    let finalScore = 0;

    Object.values(scoresByGroup).forEach((groupData) => {
      let groupTotal = groupData.score;

      if (groupData.order === 3) {
        groupTotal = Math.min(groupTotal, 4);
      }

      if (groupData.order === 6) {
        groupTotal = Math.min(groupTotal, 2);
      }

      if (groupData.order === 9) {
        groupTotal = Math.min(groupTotal, 4);
      }

      finalScore += groupTotal;
    });

    let classification = "Robusto";
    if (finalScore >= 7 && finalScore <= 14) {
      classification = "Pré-Fragil";
    } else if (finalScore >= 15) {
      classification = "Frágil";
    }

    return await this.prisma.questionnaireResponse.create({
      data: {
        participantId: dto.participantId,
        healthProfessionalId: dto.healthProfessionalId,
        questionnaireId: dto.questionnaireId,
        totalScore: finalScore,
        classification: classification,
        answers: {
          create: dto.answers.map((ans) => ({
            questionId: ans.questionId,
            selectedOptionId: ans.selectedOptionId,
            valueText: ans.valueText,
          })),
        },
      },
    });
  }

  async findAll(filters: FilterQuestionnaireResponseDto) {
    const {
      page = 1,
      pageSize = 10,
      search,
      participantEmail,
      participantName,
      healthProfessionalEmail,
      healthProfessionalName,
      questionnaireSlug,
      startDate,
      endDate,
    } = filters;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const conditions: Prisma.QuestionnaireResponseWhereInput[] = [];

    if (participantEmail) {
      conditions.push({
        participant: {
          user: {
            email: { contains: participantEmail, mode: "insensitive" },
          },
        },
      });
    }

    if (participantName) {
      conditions.push({
        participant: {
          user: {
            fullName: { contains: participantName, mode: "insensitive" },
          },
        },
      });
    }

    if (healthProfessionalEmail) {
      conditions.push({
        healthProfessional: {
          user: {
            email: { contains: healthProfessionalEmail, mode: "insensitive" },
          },
        },
      });
    }

    if (healthProfessionalName) {
      conditions.push({
        healthProfessional: {
          user: {
            fullName: {
              contains: healthProfessionalName,
              mode: "insensitive",
            },
          },
        },
      });
    }

    if (questionnaireSlug) {
      conditions.push({
        questionnaire: {
          slug: questionnaireSlug,
        },
      });
    }

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = endOfDay;
      }
      conditions.push({ date: dateFilter });
    }

    if (search) {
      const termNormalized = normalizeString(search);
      conditions.push({
        OR: [
          {
            participant: {
              user: {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  {
                    fullName_normalized: {
                      contains: termNormalized,
                      mode: "insensitive",
                    },
                  },
                  { email: { contains: search } },
                ],
              },
            },
          },
          {
            healthProfessional: {
              user: {
                OR: [
                  { fullName: { contains: search, mode: "insensitive" } },
                  {
                    fullName_normalized: {
                      contains: termNormalized,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
          {
            questionnaire: {
              title: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    const where: Prisma.QuestionnaireResponseWhereInput = { AND: conditions };

    const [responses, total] = await Promise.all([
      this.prisma.questionnaireResponse.findMany({
        where,
        select: {
          id: true,
          totalScore: true,
          classification: true,
          date: true,
          questionnaire: {
            select: {
              title: true,
              slug: true,
            },
          },
          participant: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          healthProfessional: {
            select: {
              id: true,
              speciality: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        skip,
        take,
        orderBy: { date: "desc" },
      }),
      this.prisma.questionnaireResponse.count({ where }),
    ]);

    const formattedData = responses.map((r) => ({
      id: r.id,
      date: r.date,
      totalScore: r.totalScore,
      classification: r.classification,
      questionnaireTitle: r.questionnaire.title,
      questionnaireSlug: r.questionnaire.slug,
      participantId: r.participant.id,
      participantName: r.participant.user.fullName,
      participantEmail: r.participant.user.email,
      healthProfessionalId: r.healthProfessional.id,
      healthProfessionalName: r.healthProfessional.user.fullName,
      healthProfessionalSpeciality: r.healthProfessional.speciality,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        pageSize,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  async findAllByParticipant(participantId: string) {
    return await this.prisma.questionnaireResponse.findMany({
      where: { participantId },
      orderBy: { date: "desc" },
      include: {
        healthProfessional: {
          select: { user: { select: { fullName: true } } },
        },
        questionnaire: { select: { title: true } },
        answers: {
          include: {
            question: { select: { statement: true } },
            selectedOption: { select: { label: true, score: true } },
          },
        },
      },
    });
  }

  async findOneResponse(responseId: string) {
    return await this.prisma.questionnaireResponse.findUnique({
      where: { id: responseId },
      include: {
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
        participant: { select: { user: { select: { fullName: true } } } },
      },
    });
  }

  private static readonly GROUP_TO_DOMAIN: Record<
    number,
    keyof IvcfDomainScores
  > = {
      1: "age",
      2: "selfPerception",
      3: "functionalCapacity",
      4: "functionalCapacity",
      5: "cognition",
      6: "mood",
      7: "mobility",
      8: "communication",
      9: "comorbidities",
    };

  private static readonly GROUP_CAPS: Record<number, number> = {
    3: 4,
    6: 2,
    9: 4,
  };

  private static readonly DOMAIN_DEFAULTS: IvcfDomainScores = {
    age: 0,
    selfPerception: 0,
    functionalCapacity: 0,
    cognition: 0,
    mood: 0,
    mobility: 0,
    communication: 0,
    comorbidities: 0,
  };

  private async getIvcfResponsesQuery(participantId: string) {
    const responseIds = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT ON (DATE(qr."date"))
        qr."id"
      FROM "questionnaire_response" AS qr
      INNER JOIN "questionnaire" AS q
        ON q."id" = qr."questionnaireId"
      WHERE qr."participantId" = ${participantId}
        AND q."slug" = 'ivcf-20'
      ORDER BY DATE(qr."date") ASC, qr."createdAt" DESC
    `;

    const ids = responseIds.map((row) => row.id);

    if (ids.length === 0) {
      return [];
    }

    return this.prisma.questionnaireResponse.findMany({
      where: { id: { in: ids } },
      orderBy: { date: "asc" },
      include: {
        answers: {
          include: {
            selectedOption: { select: { score: true, label: true } },
            question: {
              select: {
                statement: true,
                group: { select: { order: true } },
                subGroup: {
                  select: {
                    group: { select: { order: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getFragilityDashboard(
    healthProfessionalId: string,
    query: FragilityDashboardQueryDto,
  ): Promise<FragilityDashboardResponse> {
    const stratification = query.stratification || "ageGroup";
    const { assessments, hadResponses } = await this.getFragilityAssessments(
      healthProfessionalId,
      query,
    );

    if (assessments.length === 0 && !hadResponses) {
      return this.buildEmptyDashboard();
    }

    return await this.buildDashboardFromAssessments(
      assessments,
      stratification,
      healthProfessionalId,
    );
  }

  async exportFragilityDashboardCsv(
    healthProfessionalId: string,
    query: FragilityDashboardQueryDto,
  ) {
    const { assessments } = await this.getFragilityAssessments(
      healthProfessionalId,
      query,
    );

    return this.buildFragilityCsv(assessments);
  }

  private async getFragilityAssessments(
    healthProfessionalId: string,
    query: FragilityDashboardQueryDto,
  ): Promise<{ assessments: FragilityAssessmentRow[]; hadResponses: boolean }> {
    const responseIds = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT ON (qr."participantId")
        qr."id"
      FROM "questionnaire_response" AS qr
      INNER JOIN "questionnaire" AS q
        ON q."id" = qr."questionnaireId"
      WHERE qr."healthProfessionalId" = ${healthProfessionalId}
        AND q."slug" = 'ivcf-20'
        ${query.start
        ? Prisma.sql`AND qr."date" >= ${new Date(query.start)}`
        : Prisma.empty
      }
        ${query.end
        ? Prisma.sql`AND qr."date" <= ${new Date(query.end)}`
        : Prisma.empty
      }
      ORDER BY qr."participantId", qr."createdAt" DESC
    `;

    const ids = responseIds.map((row) => row.id);

    if (ids.length === 0) {
      return { assessments: [], hadResponses: false };
    }

    const responses = await this.prisma.questionnaireResponse.findMany({
      where: { id: { in: ids } },
      include: {
        participant: {
          select: {
            id: true,
            birthday: true,
            gender: true,
            user: { select: { fullName: true } },
          },
        },
        answers: {
          include: {
            selectedOption: { select: { score: true, label: true } },
            question: {
              select: {
                id: true,
                statement: true,
                group: { select: { order: true } },
                subGroup: {
                  select: {
                    group: { select: { order: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const sexFilter = query.sex && query.sex !== "all" ? query.sex : undefined;
    const ageMin = query.ageMin;
    const ageMax = query.ageMax;

    const assessments = responses
      .map((response) => {
        const age = this.getAge(response.participant.birthday);
        const sex = this.mapGenderToSex(response.participant.gender);
        const scores = this.computeDomainsFromAnswers(response.answers);
        const riskLevel = this.classifyRisk(scores.totalScore);

        return {
          id: response.id,
          participantId: response.participant.id,
          participantName: response.participant.user.fullName,
          healthProfessionalId,
          age,
          sex,
          score: scores.totalScore,
          riskLevel,
          date: response.date.toISOString(),
          domains: scores.domains,
          answers: response.answers.map((answer) => ({
            valueText: answer.valueText,
            selectedOption: answer.selectedOption,
            question: answer.question,
          })),
        };
      })
      .filter((assessment) => {
        if (sexFilter && assessment.sex !== sexFilter) {
          return false;
        }
        if (ageMin !== undefined && assessment.age < ageMin) {
          return false;
        }
        if (ageMax !== undefined && assessment.age > ageMax) {
          return false;
        }
        return true;
      });

    return { assessments, hadResponses: true };
  }

  private buildFragilityCsv(assessments: FragilityAssessmentRow[]) {
    const escapeValue = (value: unknown) => {
      if (value === null || value === undefined) {
        return "";
      }
      const str = String(value);
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const questionMap = new Map<string, string>();

    for (const assessment of assessments) {
      for (const answer of assessment.answers) {
        if (!questionMap.has(answer.question.id)) {
          questionMap.set(answer.question.id, answer.question.statement);
        }
      }
    }

    const questionColumns = Array.from(questionMap.entries())
      .sort((a, b) => {
        const statementDiff = a[1].localeCompare(b[1]);
        if (statementDiff !== 0) {
          return statementDiff;
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([id, statement]) => ({
        id,
        header: `question_${id}: ${statement}`,
      }));

    const headers = [
      "assessmentId",
      "participantId",
      "participantName",
      "healthProfessionalId",
      "sex",
      "age",
      "date",
      "totalScore",
      "riskLevel",
      "domain_age",
      "domain_selfPerception",
      "domain_functionalCapacity",
      "domain_cognition",
      "domain_mood",
      "domain_mobility",
      "domain_communication",
      "domain_comorbidities",
      ...questionColumns.map((col) => col.header),
    ];

    const lines: string[] = [headers.map(escapeValue).join(",")];

    for (const assessment of assessments) {
      const answerMap = new Map<string, string>();
      for (const answer of assessment.answers) {
        const value =
          answer.selectedOption?.label || answer.valueText || "";
        answerMap.set(answer.question.id, value);
      }

      const row = [
        assessment.id,
        assessment.participantId,
        assessment.participantName,
        assessment.healthProfessionalId,
        assessment.sex || "",
        assessment.age,
        assessment.date,
        assessment.score,
        assessment.riskLevel,
        assessment.domains.age,
        assessment.domains.selfPerception,
        assessment.domains.functionalCapacity,
        assessment.domains.cognition,
        assessment.domains.mood,
        assessment.domains.mobility,
        assessment.domains.communication,
        assessment.domains.comorbidities,
        ...questionColumns.map((col) => answerMap.get(col.id) || ""),
      ];

      lines.push(row.map(escapeValue).join(","));
    }

    return `${lines.join("\r\n")}\r\n`;
  }

  private computeAssessment(
    response: Awaited<ReturnType<typeof this.getIvcfResponsesQuery>>[number],
  ): IvcfAssessment {
    const scoresByGroupOrder: Record<number, number> = {};
    const rawResponses: Record<string, string> = {};

    for (const answer of response.answers) {
      const groupOrder =
        answer.question.group?.order ?? answer.question.subGroup?.group?.order;

      if (groupOrder !== undefined && answer.selectedOption) {
        scoresByGroupOrder[groupOrder] =
          (scoresByGroupOrder[groupOrder] || 0) + answer.selectedOption.score;
      }
      if (answer.selectedOption) {
        rawResponses[answer.question.statement] = answer.selectedOption.label;
      } else if (answer.valueText) {
        rawResponses[answer.question.statement] = answer.valueText;
      }
    }

    for (const [orderStr, cap] of Object.entries(
      QuestionnaireService.GROUP_CAPS,
    )) {
      const order = Number(orderStr);
      if (scoresByGroupOrder[order] !== undefined) {
        scoresByGroupOrder[order] = Math.min(scoresByGroupOrder[order], cap);
      }
    }

    const domains: IvcfDomainScores = {
      ...QuestionnaireService.DOMAIN_DEFAULTS,
    };

    for (const [orderStr, score] of Object.entries(scoresByGroupOrder)) {
      const domainKey = QuestionnaireService.GROUP_TO_DOMAIN[Number(orderStr)];
      if (domainKey) {
        domains[domainKey] += score;
      }
    }

    // o total do banco estava vindo como 0, provavelmente por conta das seeds
    // então recalculei em memória. depois conversar com Lucca sobre
    const totalScore = Object.values(domains).reduce(
      (sum, val) => sum + val,
      0,
    );

    let riskLevel = "Robusto";
    if (totalScore >= 7 && totalScore <= 14) {
      riskLevel = "Pré-Fragil";
    } else if (totalScore >= 15) {
      riskLevel = "Frágil";
    }

    return {
      id: response.id,
      date: response.date.toISOString(),
      totalScore,
      riskLevel,
      domains,
      rawResponses,
    };
  }

  private buildEmptyDashboard() {
    return {
      summary: {
        total: 0,
        avgScore: 0,
        avgAge: 0,
        topAgeGroups: [],
      },
      charts: {
        riskBar: [],
        heatmap: [],
        riskPyramid: [],
        scatter: [],
        trend: [],
        domainDrilldown: [],
      },
      metadata: {
        ageBounds: { min: 0, max: 0 },
      },
    };
  }

  private async buildDashboardFromAssessments(
    assessments: Array<{
      id: string;
      age: number;
      sex: "M" | "F" | null;
      score: number;
      riskLevel: "Robusto" | "Pré-frágil" | "Frágil";
      date: string;
      domains: IvcfDomainScores;
      answers: Array<{
        selectedOption: { score: number; label: string } | null;
        question: {
          id: string;
          statement: string;
          group?: { order: number } | null;
          subGroup?: { group: { order: number } } | null;
        };
      }>;
    }>,
    stratification: "sex" | "ageGroup",
    healthProfessionalId: string,
  ) {
    if (assessments.length === 0) {
      const trend = await this.buildMonthlyTrend(healthProfessionalId);
      return {
        summary: {
          total: 0,
          avgScore: 0,
          avgAge: 0,
          topAgeGroups: [],
        },
        charts: {
          riskBar: [],
          heatmap: [],
          riskPyramid: [],
          scatter: [],
          trend,
          domainDrilldown: [],
        },
        metadata: {
          ageBounds: { min: 0, max: 0 },
        },
      };
    }

    const total = assessments.length;
    const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
    const totalAge = assessments.reduce((sum, a) => sum + a.age, 0);

    const avgScore = total > 0 ? totalScore / total : 0;
    const avgAge = total > 0 ? totalAge / total : 0;

    const ageGroups = {
      "60-74": 0,
      "75-84": 0,
      "85+": 0,
    };

    const minAge = assessments.reduce(
      (min, a) => (a.age < min ? a.age : min),
      assessments[0]?.age ?? 0,
    );

    const maxAge = assessments.reduce(
      (max, a) => (a.age > max ? a.age : max),
      assessments[0]?.age ?? 0,
    );

    for (const assessment of assessments) {
      if (assessment.age <= 74) {
        ageGroups["60-74"]++;
      } else if (assessment.age <= 84) {
        ageGroups["75-84"]++;
      } else {
        ageGroups["85+"]++;
      }
    }

    const riskCounts = {
      Robusto: 0,
      "Pré-frágil": 0,
      Frágil: 0,
    };

    for (const assessment of assessments) {
      if (assessment.riskLevel === "Robusto") {
        riskCounts.Robusto++;
      } else if (assessment.riskLevel === "Pré-frágil") {
        riskCounts["Pré-frágil"]++;
      } else {
        riskCounts["Frágil"]++;
      }
    }

    const riskBar = total
      ? [
        {
          category: "Robusto",
          count: riskCounts.Robusto,
        },
        {
          category: "Pré-frágil",
          count: riskCounts["Pré-frágil"],
        },
        {
          category: "Frágil",
          count: riskCounts["Frágil"],
        },
      ]
      : [];

    const scatter = [
      {
        id: "Masculino",
        data: assessments
          .filter((a) => a.sex === "M")
          .map((a) => ({
            x: a.age,
            y: Number(a.score.toFixed(1)),
            age: a.age,
            sex: "M",
            riskLevel: a.riskLevel,
            date: a.date,
          })),
      },
      {
        id: "Feminino",
        data: assessments
          .filter((a) => a.sex === "F")
          .map((a) => ({
            x: a.age,
            y: Number(a.score.toFixed(1)),
            age: a.age,
            sex: "F",
            riskLevel: a.riskLevel,
            date: a.date,
          })),
      },
    ];

    const groups =
      stratification === "ageGroup"
        ? ["60-74", "75-84", "85+"]
        : ["Masculino", "Feminino"];

    const heatmap = Object.entries(
      QuestionnaireService.DOMAIN_LABELS,
    ).map(([key, label]) => {
      return {
        id: label,
        data: groups.map((group) => {
          const groupAssessments = assessments.filter((assessment) => {
            if (stratification === "ageGroup") {
              if (group === "60-74") {
                return assessment.age <= 74;
              }
              if (group === "75-84") {
                return assessment.age > 74 && assessment.age <= 84;
              }
              return assessment.age > 84;
            }
            return group === "Masculino"
              ? assessment.sex === "M"
              : assessment.sex === "F";
          });

          const sum = groupAssessments.reduce(
            (acc, assessment) => acc + assessment.domains[key as keyof IvcfDomainScores],
            0,
          );

          const avg = groupAssessments.length > 0 ? sum / groupAssessments.length : 0;

          return { x: group, y: Number(avg.toFixed(2)) };
        }),
      };
    });

    const riskPyramid =
      stratification === "ageGroup"
        ? ["60-74", "75-84", "85+"]
          .map((group) => {
            const groupAssessments = assessments.filter((assessment) => {
              if (group === "60-74") {
                return assessment.age <= 74;
              }
              if (group === "75-84") {
                return assessment.age > 74 && assessment.age <= 84;
              }
              return assessment.age > 84;
            });

            return {
              group,
              Robusto: groupAssessments.filter(
                (a) => a.riskLevel === "Robusto",
              ).length,
              "Pré-frágil": groupAssessments.filter(
                (a) => a.riskLevel === "Pré-frágil",
              ).length,
              "Frágil": groupAssessments.filter(
                (a) => a.riskLevel === "Frágil",
              ).length,
            };
          })
        : ["Masculino", "Feminino"].map((group) => {
          const groupAssessments = assessments.filter((assessment) =>
            group === "Masculino"
              ? assessment.sex === "M"
              : assessment.sex === "F",
          );

          return {
            group,
            Robusto: groupAssessments.filter(
              (a) => a.riskLevel === "Robusto",
            ).length,
            "Pré-frágil": groupAssessments.filter(
              (a) => a.riskLevel === "Pré-frágil",
            ).length,
            "Frágil": groupAssessments.filter(
              (a) => a.riskLevel === "Frágil",
            ).length,
          };
        });

    const domainDrilldown = this.buildDomainDrilldown(assessments);

    const trend = await this.buildMonthlyTrend(healthProfessionalId);

    return {
      summary: {
        total,
        avgScore: Number(avgScore.toFixed(1)),
        avgAge: Number(avgAge.toFixed(1)),
        topAgeGroups: Object.entries(ageGroups).map(([label, value]) => ({
          label,
          value,
        })),
      },
      charts: {
        riskBar,
        heatmap,
        riskPyramid,
        scatter,
        trend,
        domainDrilldown,
      },
      metadata: {
        ageBounds: { min: minAge, max: maxAge },
      },
    };
  }

  private buildDomainDrilldown(
    assessments: Array<{
      answers: Array<{
        selectedOption: { label: string } | null;
        question: {
          id: string;
          statement: string;
          group?: { order: number } | null;
          subGroup?: { group: { order: number } } | null;
        };
      }>;
    }>,
  ) {
    const domainMap = new Map<
      keyof IvcfDomainScores,
      {
        id: string;
        label: string;
        counts: { sim: number; nao: number };
        children: Map<
          string,
          { id: string; label: string; counts: { sim: number; nao: number } }
        >;
      }
    >();

    for (const assessment of assessments) {
      for (const answer of assessment.answers) {
        if (!answer.selectedOption?.label) {
          continue;
        }

        const normalizedLabel =
          normalizeString(answer.selectedOption.label)?.toLowerCase() || "";
        const isYes = normalizedLabel === "sim";
        const isNo = normalizedLabel === "nao";

        if (!isYes && !isNo) {
          continue;
        }

        const groupOrder =
          answer.question.group?.order ??
          answer.question.subGroup?.group?.order;
        const domainKey =
          groupOrder !== undefined
            ? QuestionnaireService.GROUP_TO_DOMAIN[groupOrder]
            : undefined;

        if (!domainKey) {
          continue;
        }

        if (!domainMap.has(domainKey)) {
          domainMap.set(domainKey, {
            id: domainKey,
            label: QuestionnaireService.DOMAIN_LABELS[domainKey],
            counts: { sim: 0, nao: 0 },
            children: new Map(),
          });
        }

        const domainNode = domainMap.get(domainKey);
        if (!domainNode) {
          continue;
        }

        if (!domainNode.children.has(answer.question.id)) {
          domainNode.children.set(answer.question.id, {
            id: answer.question.id,
            label: answer.question.statement,
            counts: { sim: 0, nao: 0 },
          });
        }

        const questionNode = domainNode.children.get(answer.question.id);
        if (!questionNode) {
          continue;
        }

        if (isYes) {
          questionNode.counts.sim += 1;
          domainNode.counts.sim += 1;
        } else if (isNo) {
          questionNode.counts.nao += 1;
          domainNode.counts.nao += 1;
        }
      }
    }

    return Array.from(domainMap.values()).map((domain) => ({
      id: domain.id,
      label: domain.label,
      counts: domain.counts,
      children: Array.from(domain.children.values()),
    }));
  }

  private async buildMonthlyTrend(healthProfessionalId: string) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthKey = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${date.getFullYear()}-${month}`;
    };

    return this.prisma
      .$queryRaw<{ month: Date; total: number }[]>`
        SELECT date_trunc('month', qr."createdAt") AS month,
               COUNT(*)::int AS total
        FROM "questionnaire_response" AS qr
        WHERE qr."healthProfessionalId" = ${healthProfessionalId}
          AND qr."createdAt" >= ${start}
          AND qr."createdAt" < ${end}
        GROUP BY 1
        ORDER BY 1
      `
      .then((rows) => {
        const counts = new Map(
          rows.map((row) => [monthKey(new Date(row.month)), row.total]),
        );

        const data = Array.from({ length: 12 }).map((_, index) => {
          const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
          const key = monthKey(date);
          return {
            x: `${key}-01`,
            y: counts.get(key) || 0,
          };
        });

        return [{ id: "Cohort", data }];
      });
  }

  async getCurrentMonthStats(
    healthProfessionalId: string,
  ): Promise<CurrentMonthStatsResponse> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await this.prisma.questionnaireResponse.findMany({
      where: {
        healthProfessionalId,
        createdAt: {
          gte: start,
          lt: end,
        },
        questionnaire: { slug: "ivcf-20" },
      },
      select: {
        participant: {
          select: {
            gender: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });

    let male = 0;
    let female = 0;

    for (const row of rows) {
      if (row.participant.gender === Gender.MALE) {
        male += 1;
      } else if (row.participant.gender === Gender.FEMALE) {
        female += 1;
      }
    }

    return {
      total: rows.length,
      male,
      female,
    };
  }

  private computeDomainsFromAnswers(
    answers: Array<{
      selectedOption: { score: number } | null;
      question: {
        group?: { order: number } | null;
        subGroup?: { group: { order: number } } | null;
      };
    }>,
  ) {
    const scoresByGroupOrder: Record<number, number> = {};

    for (const answer of answers) {
      const groupOrder =
        answer.question.group?.order ?? answer.question.subGroup?.group?.order;
      if (groupOrder !== undefined && answer.selectedOption) {
        scoresByGroupOrder[groupOrder] =
          (scoresByGroupOrder[groupOrder] || 0) + answer.selectedOption.score;
      }
    }

    for (const [orderStr, cap] of Object.entries(
      QuestionnaireService.GROUP_CAPS,
    )) {
      const order = Number(orderStr);
      if (scoresByGroupOrder[order] !== undefined) {
        scoresByGroupOrder[order] = Math.min(scoresByGroupOrder[order], cap);
      }
    }

    const domains: IvcfDomainScores = {
      ...QuestionnaireService.DOMAIN_DEFAULTS,
    };

    for (const [orderStr, score] of Object.entries(scoresByGroupOrder)) {
      const domainKey = QuestionnaireService.GROUP_TO_DOMAIN[Number(orderStr)];
      if (domainKey) {
        domains[domainKey] += score;
      }
    }

    const totalScore = Object.values(domains).reduce(
      (sum, val) => sum + val,
      0,
    );

    return { domains, totalScore };
  }

  private classifyRisk(score: number) {
    if (score < 7) return "Robusto" as const;
    if (score < 15) return "Pré-frágil" as const;
    return "Frágil" as const;
  }

  private mapGenderToSex(gender: Gender | null) {
    if (gender === Gender.MALE) {
      return "M" as const;
    }
    if (gender === Gender.FEMALE) {
      return "F" as const;
    }
    return null;
  }

  private getAge(birthday: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age -= 1;
    }

    return age;
  }

  private async getParticipantWithName(participantId: string) {
    return this.prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { user: { select: { fullName: true } } },
    });
  }

  async getParticipantEvolution(
    participantId: string,
  ): Promise<ParticipantEvolutionResponse> {
    const [participant, responses] = await Promise.all([
      this.getParticipantWithName(participantId),
      this.getIvcfResponsesQuery(participantId),
    ]);

    const assessments = responses.map((r) => this.computeAssessment(r));

    return {
      participantId,
      participantName: participant.user.fullName,
      assessments,
    };
  }

  async getParticipantSummary(
    participantId: string,
  ): Promise<ParticipantSummaryResponse> {
    const [participant, responses] = await Promise.all([
      this.getParticipantWithName(participantId),
      this.getIvcfResponsesQuery(participantId),
    ]);

    const assessments = responses.map((r) => this.computeAssessment(r));
    const last =
      assessments.length > 0 ? assessments[assessments.length - 1] : null;

    return {
      participantId,
      participantName: participant.user.fullName,
      totalAssessments: assessments.length,
      lastAssessment: last
        ? {
          id: last.id,
          date: last.date,
          totalScore: last.totalScore,
          riskLevel: last.riskLevel,
          domains: last.domains,
        }
        : null,
    };
  }

  async getScoreHistory(participantId: string): Promise<ScoreHistoryResponse> {
    const [participant, responses] = await Promise.all([
      this.getParticipantWithName(participantId),
      this.getIvcfResponsesQuery(participantId),
    ]);

    const scores = responses.map((r) => {
      const assessment = this.computeAssessment(r);
      return {
        id: assessment.id,
        date: assessment.date,
        totalScore: assessment.totalScore,
        riskLevel: assessment.riskLevel,
      };
    });

    return {
      participantId,
      participantName: participant.user.fullName,
      scores,
    };
  }

  async getDomainHistory(
    participantId: string,
  ): Promise<DomainHistoryResponse> {
    const [participant, responses] = await Promise.all([
      this.getParticipantWithName(participantId),
      this.getIvcfResponsesQuery(participantId),
    ]);

    const history = responses.map((r) => {
      const assessment = this.computeAssessment(r);
      return {
        id: assessment.id,
        date: assessment.date,
        domains: assessment.domains,
      };
    });

    return {
      participantId,
      participantName: participant.user.fullName,
      history,
    };
  }

  async getAssessmentDetail(
    participantId: string,
    assessmentId: string,
  ): Promise<AssessmentDetailResponse> {
    const response = await this.prisma.questionnaireResponse.findUniqueOrThrow({
      where: {
        id: assessmentId,
        participantId,
        questionnaire: { slug: "ivcf-20" },
      },
      include: {
        answers: {
          include: {
            selectedOption: { select: { score: true, label: true } },
            question: {
              select: {
                statement: true,
                group: { select: { order: true } },
                subGroup: {
                  select: {
                    group: { select: { order: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return this.computeAssessment(response);
  }
}