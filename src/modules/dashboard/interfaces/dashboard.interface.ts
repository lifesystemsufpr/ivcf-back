export interface TotalParticipantsResponse {
  totalParticipants: number;
}

export interface AverageScoreResponse {
  averageScore: number;
  totalAssessments: number;
}

export interface AverageAgeResponse {
  averageAge: number;
}

export interface AgeDistributionResponse {
  range: string;
  total: number;
}

export interface RiskDistributionResponse {
  risk: string;
  total: number;
}

export interface RiskPyramidResponse {
  risk: string;
  male: number;
  female: number;
  others: number;
}

export interface DomainHeatmapResponse {
  domain: string;
  male: number;
  female: number;
  others: number;
}

export interface AgeVsFragilityResponse {
  age: number;
  fragility: number;
}

export interface DomainPerformanceResponse {
  domain: string;
  average: number;
  evaluatedParticipants: number;
}
