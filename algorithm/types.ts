export const GEIS_DOMAINS = [
  'biomarkers',
  'nutrition',
  'exercise',
  'mind',
  'sleep',
] as const;

export type GeisDomain = (typeof GEIS_DOMAINS)[number];

export type DomainScores = Record<GeisDomain, number>;

export type DomainConfidence = Partial<Record<GeisDomain, number>>;

export interface GeisAlgorithmConfig {
  version: string;
  weights: Record<GeisDomain, number>;
  balancePenalty: {
    method: 'population-standard-deviation';
    lambda: number;
  };
  missingDataMode: 'strict';
}

export interface GeisInput {
  scores: DomainScores;
  confidence?: DomainConfidence;
  /**
   * Genomic information may inform interpretation, target ranges, or
   * confidence. It is deliberately excluded from the numeric GEIS formula.
   */
  genomicContext?: {
    available: boolean;
    source?: string;
  };
}

export interface GeisResult {
  algorithmVersion: string;
  weightedBaseScore: number;
  balanceStandardDeviation: number;
  balancePenalty: number;
  finalGeis: number;
  dataConfidence: number;
  bottleneck: GeisDomain;
  domainContributions: Record<GeisDomain, number>;
  formula: 'Weighted Base Score - lambda * Population StdDev';
  researchUseNotice: string;
}

export interface DashboardBreakdown {
  biomarker: number;
  food: number;
  exercise: number;
  mind: number;
  sleep: number;
}
