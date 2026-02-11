"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const normalize_string_1 = require("../../shared/functions/normalize-string");
let QuestionnaireService = class QuestionnaireService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async createResponse(dto) {
        const optionIds = dto.answers
            .filter((a) => a.selectedOptionId)
            .map((a) => a.selectedOptionId);
        const selectedOptions = await this.prisma.questionOption.findMany({
            where: { id: { in: optionIds } },
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
            throw new common_1.NotFoundException("Nenhuma opção válida encontrada.");
        }
        const scoresByGroup = {};
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
        }
        else if (finalScore >= 15) {
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
    async findAll(filters) {
        const { page = 1, pageSize = 10, search, participantCpf, participantName, healthProfessionalCpf, healthProfessionalName, questionnaireSlug, startDate, endDate, } = filters;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const conditions = [];
        if (participantCpf) {
            conditions.push({
                participant: {
                    user: {
                        cpf: { contains: participantCpf, mode: "insensitive" },
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
        if (healthProfessionalCpf) {
            conditions.push({
                healthProfessional: {
                    user: {
                        cpf: { contains: healthProfessionalCpf, mode: "insensitive" },
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
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = startDate;
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                dateFilter.lte = endOfDay;
            }
            conditions.push({ date: dateFilter });
        }
        if (search) {
            const termNormalized = (0, normalize_string_1.normalizeString)(search);
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
                                    { cpf: { contains: search } },
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
        const where = { AND: conditions };
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
                                    cpf: true,
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
            participantCpf: r.participant.user.cpf,
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
    async findAllByParticipant(participantId) {
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
    async findOneResponse(responseId) {
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
};
exports.QuestionnaireService = QuestionnaireService;
exports.QuestionnaireService = QuestionnaireService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionnaireService);
//# sourceMappingURL=questionnaire.service.js.map