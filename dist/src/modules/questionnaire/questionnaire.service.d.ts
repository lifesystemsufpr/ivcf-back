import { CreateResponseDto } from "./dto/create-response.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { FilterQuestionnaireResponseDto } from "./dto/filter-questionnaire-response.dto";
export declare class QuestionnaireService {
    private prisma;
    constructor(prisma: PrismaService);
    getIvcfStructure(): Promise<({
        groups: ({
            subGroups: ({
                questions: ({
                    options: {
                        id: string;
                        order: number;
                        label: string;
                        score: number;
                        questionId: string;
                    }[];
                } & {
                    type: import(".prisma/client").$Enums.QuestionType;
                    id: string;
                    required: boolean;
                    order: number;
                    statement: string;
                    groupId: string | null;
                    subGroupId: string | null;
                })[];
            } & {
                id: string;
                description: string | null;
                title: string;
                order: number;
                groupId: string;
            })[];
            questions: ({
                options: {
                    id: string;
                    order: number;
                    label: string;
                    score: number;
                    questionId: string;
                }[];
            } & {
                type: import(".prisma/client").$Enums.QuestionType;
                id: string;
                required: boolean;
                order: number;
                statement: string;
                groupId: string | null;
                subGroupId: string | null;
            })[];
        } & {
            id: string;
            description: string | null;
            title: string;
            questionnaireId: string;
            order: number;
        })[];
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        slug: string;
        version: string;
    }) | null>;
    createResponse(dto: CreateResponseDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        totalScore: number;
        classification: string | null;
        date: Date;
        participantId: string;
        healthProfessionalId: string;
        healthcareUnitId: string;
        questionnaireId: string;
    }>;
    findAll(filters: FilterQuestionnaireResponseDto): Promise<{
        data: {
            id: string;
            date: Date;
            totalScore: number;
            classification: string | null;
            questionnaireTitle: string;
            questionnaireSlug: string;
            participantId: string;
            participantName: string;
            participantCpf: string;
            healthProfessionalId: string;
            healthProfessionalName: string;
            healthProfessionalSpeciality: string;
        }[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
    findAllByParticipant(participantId: string): Promise<({
        healthProfessional: {
            user: {
                fullName: string;
            };
        };
        questionnaire: {
            title: string;
        };
        answers: ({
            question: {
                statement: string;
            };
            selectedOption: {
                label: string;
                score: number;
            } | null;
        } & {
            id: string;
            questionId: string;
            valueText: string | null;
            selectedOptionId: string | null;
            questionnaireResponseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        totalScore: number;
        classification: string | null;
        date: Date;
        participantId: string;
        healthProfessionalId: string;
        healthcareUnitId: string;
        questionnaireId: string;
    })[]>;
    findOneResponse(responseId: string): Promise<({
        participant: {
            user: {
                fullName: string;
            };
        };
        answers: ({
            question: {
                type: import(".prisma/client").$Enums.QuestionType;
                id: string;
                required: boolean;
                order: number;
                statement: string;
                groupId: string | null;
                subGroupId: string | null;
            };
            selectedOption: {
                id: string;
                order: number;
                label: string;
                score: number;
                questionId: string;
            } | null;
        } & {
            id: string;
            questionId: string;
            valueText: string | null;
            selectedOptionId: string | null;
            questionnaireResponseId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        totalScore: number;
        classification: string | null;
        date: Date;
        participantId: string;
        healthProfessionalId: string;
        healthcareUnitId: string;
        questionnaireId: string;
    }) | null>;
}
