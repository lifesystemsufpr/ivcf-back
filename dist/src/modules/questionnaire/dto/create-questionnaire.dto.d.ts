import { QuestionType } from "@prisma/client";
export declare class CreateQuestionOptionDto {
    label: string;
    score: number;
    order: number;
}
export declare class CreateQuestionDto {
    statement: string;
    order: number;
    type: QuestionType;
    required?: boolean;
    options: CreateQuestionOptionDto[];
}
export declare class CreateQuestionSubGroupDto {
    title: string;
    order: number;
    description?: string;
    questions: CreateQuestionDto[];
}
export declare class CreateQuestionGroupDto {
    title: string;
    order: number;
    description?: string;
    questions?: CreateQuestionDto[];
    subGroups?: CreateQuestionSubGroupDto[];
}
export declare class CreateQuestionnaireDto {
    title: string;
    slug: string;
    description?: string;
    version?: string;
    groups: CreateQuestionGroupDto[];
}
