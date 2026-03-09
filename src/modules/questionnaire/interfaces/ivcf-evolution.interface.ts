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

export interface ParticipantSummaryResponse {
  participantId: string;
  participantName: string;
  totalAssessments: number;
  lastAssessment: {
    id: string;
    date: string;
    totalScore: number;
    riskLevel: string;
    domains: IvcfDomainScores;
  } | null;
}

export interface ScoreHistoryItem {
  id: string;
  date: string;
  totalScore: number;
  riskLevel: string;
}

export interface ScoreHistoryResponse {
  participantId: string;
  participantName: string;
  scores: ScoreHistoryItem[];
}

export interface DomainHistoryItem {
  id: string;
  date: string;
  domains: IvcfDomainScores;
}

export interface DomainHistoryResponse {
  participantId: string;
  participantName: string;
  history: DomainHistoryItem[];
}

export interface AssessmentDetailResponse {
  id: string;
  date: string;
  totalScore: number;
  riskLevel: string;
  domains: IvcfDomainScores;
  rawResponses: Record<string, string>;
}
