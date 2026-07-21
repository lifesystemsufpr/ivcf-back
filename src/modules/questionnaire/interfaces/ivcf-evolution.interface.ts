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

// temporário
export type FrailtyClassification = "Robusto" | "Pré-frágil" | "Frágil";

// temporário
export interface IVCF_DomainScores {
  age: number;
  selfPerception: number;
  functionalCapacity: number;
  cognition: number;
  mood: number;
  mobility: number;
  communication: number;
  comorbidities: number;
}

// temporário
export interface IVCF_Assessment {
  id: string;
  date: string;
  createdAt: string;
  totalScore: number;
  riskLevel: FrailtyClassification;
  classification: FrailtyClassification;
  domains: IVCF_DomainScores;
  rawResponses: Record<string, string>;
}

// temporário
export interface Daily_Assessment {
  date: string;
  hasMultipleAssessments: boolean;
  assessments: IVCF_Assessment[];
}

// temporário
export interface ParticipantEvolutionData {
  participantId: string;
  participantName: string;
  assessments: IVCF_Assessment[];
}

// temporário
export interface ParticipantEvolutionDailyData {
  participantId: string;
  participantName: string;
  dailyAssessments: Daily_Assessment[];
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

export interface FragilityDashboardResponse {
  summary: {
    totalParticipants: number;
    totalEvaluated: number;
    avgScore: number;
    avgAge: number;
    topAgeGroups: Array<{ label: string; value: number }>;
  };
  charts: {
    riskBar: Array<{ category: string; count: number }>;
    heatmap: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    riskPyramid: Array<{
      group: string;
      Robusto: number;
      "Pré-frágil": number;
      "Frágil": number;
    }>;
    scatter: Array<{
      id: string;
      data: Array<{
        x: number;
        y: number;
        participantId: string;
        age: number;
        sex: string;
        riskLevel: string;
        date: string;
      }>;
    }>;
    trend: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    domainDrilldown: Array<{
      id: string;
      label: string;
      counts: { sim: number; nao: number };
      children?: Array<{
        id: string;
        label: string;
        counts: { sim: number; nao: number };
        responses: Array<{
          label: string;
          count: number;
          score: number;
          indicatesFragility: boolean;
        }>;
      }>;
    }>;
  };
  metadata: {
    ageBounds: { min: number; max: number };
  };
}

export interface CurrentMonthStatsResponse {
  total: number;
  male: number;
  female: number;
}

export type FragilityAssessmentRow = {
  id: string;
  participantId: string;
  participantName: string;
  healthProfessionalId: string;
  age: number;
  sex: "M" | "F" | null;
  score: number;
  riskLevel: "Robusto" | "Pré-frágil" | "Frágil";
  date: string;
  domains: IvcfDomainScores;
  answers: Array<{
    valueText: string | null;
    selectedOption: { score: number; label: string } | null;
    selectedOptions?: Array<{ score: number; label: string }>;
    question: {
      id: string;
      order?: number;
      statement: string;
      group?: { order: number } | null;
      subGroup?: { group: { order: number } } | null;
    };
  }>;
};