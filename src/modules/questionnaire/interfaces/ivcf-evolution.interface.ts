export interface IvcfDomainScores {
  age: number;
  selfPerception: number;
  functionalCapacity: number;
  cognition: number;
  mood: number;
  mobility: number;
  communication: number;
  comorbidities: number;
}

export interface IvcfScoreResult {
  domains: IvcfDomainScores;
  totalScore: number;
  classification: string;
}

export interface IvcfAssessment {
  id: string;
  date: string;
  totalScore: number;
  riskLevel: string;
  domains: IvcfDomainScores;
  rawResponses: Record<string, string>;
}

export interface ParticipantEvolutionResponse {
  participantId: string;
  participantName: string;
  assessments: IvcfAssessment[];
}
