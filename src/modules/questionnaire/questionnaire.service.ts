import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateResponseDto } from "./dto/create-response.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { FilterQuestionnaireResponseDto } from "./dto/filter-questionnaire-response.dto";
import { Prisma } from "@prisma/client";
import { normalizeString } from "src/shared/functions/normalize-string";
import type {
  IvcfDomainScores,
  ParticipantEvolutionResponse,
} from "./interfaces/ivcf-evolution.interface";

@Injectable()
export class QuestionnaireService {
  constructor(private prisma: PrismaService) {}

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
      classification = "Em Risco de Fragilização";
    } else if (finalScore >= 15) {
      classification = "Frágil";
    }

    return await this.prisma.questionnaireResponse.create({
      data: {
        participantId: dto.participantId,
        healthProfessionalId: dto.healthProfessionalId,
        questionnaireId: dto.questionnaireId,
        totalScore: finalScore,
        healthcareUnitId: dto.healthcareUnitId,
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

  async getParticipantEvolution(
    participantId: string,
  ): Promise<ParticipantEvolutionResponse> {
    const participant = await this.prisma.participant.findUniqueOrThrow({
      where: { id: participantId },
      include: { user: { select: { fullName: true } } },
    });

    const responses = await this.prisma.questionnaireResponse.findMany({
      where: {
        participantId,
        questionnaire: { slug: "ivcf-20" },
      },
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

    const GROUP_TO_DOMAIN: Record<number, keyof IvcfDomainScores> = {
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

    const GROUP_CAPS: Record<number, number> = {
      3: 4,
      6: 2,
      9: 4,
    };

    const domainDefaults: IvcfDomainScores = {
      age: 0,
      selfPerception: 0,
      functionalCapacity: 0,
      cognition: 0,
      mood: 0,
      mobility: 0,
      communication: 0,
      comorbidities: 0,
    };

    const assessments = responses.map((response) => {
      const scoresByGroupOrder: Record<number, number> = {};
      const rawResponses: Record<string, string> = {};

      for (const answer of response.answers) {
        const groupOrder =
          answer.question.group?.order ??
          answer.question.subGroup?.group?.order;
        

        if (groupOrder !== undefined && answer.selectedOption) {
          scoresByGroupOrder[groupOrder] =
            (scoresByGroupOrder[groupOrder] || 0) +
            answer.selectedOption.score;
        }
        if (answer.selectedOption) {
          rawResponses[answer.question.statement] =
            answer.selectedOption.label;
        } else if (answer.valueText) {
          rawResponses[answer.question.statement] = answer.valueText;
        }
      }

      for (const [groupOrderStr, cap] of Object.entries(GROUP_CAPS)) {
        const order = Number(groupOrderStr);
        if (scoresByGroupOrder[order] !== undefined) {
          scoresByGroupOrder[order] = Math.min(
            scoresByGroupOrder[order],
            cap,
          );
        }
      }

      const domains = { ...domainDefaults };

      for (const [groupOrderStr, score] of Object.entries(
        scoresByGroupOrder,
      )) {
        const domainKey = GROUP_TO_DOMAIN[Number(groupOrderStr)];
        if (domainKey) {
          domains[domainKey] += score;
        }
      }
      
      // o total do banco estava vindo como 0, provavelmente por conta das seeds
      // então recalculei em memória. depois conversar com Lucca sobre 
      const calculatedTotal = Object.values(domains).reduce(
        (sum, val) => sum + val,
        0,
      );

      let riskLevel = "Robusto";
      if (calculatedTotal >= 7 && calculatedTotal <= 14) {
        riskLevel = "Em Risco de Fragilização";
      } else if (calculatedTotal >= 15) {
        riskLevel = "Frágil";
      }

      return {
        id: response.id,
        date: response.date.toISOString(),
        totalScore: calculatedTotal,
        riskLevel,
        domains,
        rawResponses,
      };
    });

    return {
      participantId,
      participantName: participant.user.fullName,
      assessments,
    };
  }
}
