declare class AnswerDto {
    questionId: string;
    selectedOptionId?: string;
    valueText?: string;
}
export declare class CreateResponseDto {
    participantId: string;
    healthProfessionalId: string;
    questionnaireId: string;
    healthcareUnitId: string;
    answers: AnswerDto[];
}
export {};
