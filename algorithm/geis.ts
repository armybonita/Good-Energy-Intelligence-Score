import { GEIS_ALGORITHM_V1 } from './config.ts';
import {
  GEIS_DOMAINS,
  type DashboardBreakdown,
  type DomainScores,
  type GeisAlgorithmConfig,
  type GeisDomain,
  type GeisInput,
  type GeisResult,
} from './types.ts';

const EPSILON = 1e-9;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function assertUnitInterval(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be a finite number between 0 and 1.`);
  }
}

function assertScore(value: number, domain: GeisDomain): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${domain} score must be a finite number between 0 and 100.`);
  }
}

export function validateConfig(config: GeisAlgorithmConfig): void {
  const weightSum = GEIS_DOMAINS.reduce(
    (sum, domain) => sum + config.weights[domain],
    0,
  );

  if (Math.abs(weightSum - 1) > EPSILON) {
    throw new RangeError(`GEIS weights must sum to 1.0; received ${weightSum}.`);
  }

  for (const domain of GEIS_DOMAINS) {
    assertUnitInterval(config.weights[domain], `${domain} weight`);
  }

  if (
    !Number.isFinite(config.balancePenalty.lambda) ||
    config.balancePenalty.lambda < 0
  ) {
    throw new RangeError('Balance-penalty lambda must be a non-negative number.');
  }
}

export function populationStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one value is required.');
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

export function calculateGeis(
  input: GeisInput,
  config: GeisAlgorithmConfig = GEIS_ALGORITHM_V1,
): GeisResult {
  validateConfig(config);

  const contributions = {} as Record<GeisDomain, number>;
  let weightedBaseScore = 0;
  let dataConfidence = 0;

  for (const domain of GEIS_DOMAINS) {
    const score = input.scores[domain];
    assertScore(score, domain);

    const confidence = input.confidence?.[domain] ?? 1;
    assertUnitInterval(confidence, `${domain} confidence`);

    const contribution = config.weights[domain] * score;
    contributions[domain] = round(contribution);
    weightedBaseScore += contribution;
    dataConfidence += config.weights[domain] * confidence;
  }

  const scoreValues = GEIS_DOMAINS.map((domain) => input.scores[domain]);
  const balanceStandardDeviation = populationStandardDeviation(scoreValues);
  const balancePenalty = config.balancePenalty.lambda * balanceStandardDeviation;
  const finalGeis = Math.max(0, Math.min(100, weightedBaseScore - balancePenalty));
  const bottleneck = GEIS_DOMAINS.reduce((lowest, domain) =>
    input.scores[domain] < input.scores[lowest] ? domain : lowest,
  );

  return {
    algorithmVersion: config.version,
    weightedBaseScore: round(weightedBaseScore),
    balanceStandardDeviation: round(balanceStandardDeviation),
    balancePenalty: round(balancePenalty),
    finalGeis: round(finalGeis),
    dataConfidence: round(dataConfidence),
    bottleneck,
    domainContributions: contributions,
    formula: 'Weighted Base Score - lambda * Population StdDev',
    researchUseNotice:
      'For health and lifestyle support only. Not a diagnosis, prescription, or clinically validated medical score.',
  };
}

/**
 * Keeps the existing dashboard UI compatible while the engine uses
 * canonical domain names.
 */
export function calculateGeisFromDashboardBreakdown(
  breakdown: DashboardBreakdown,
  config: GeisAlgorithmConfig = GEIS_ALGORITHM_V1,
): GeisResult {
  const scores: DomainScores = {
    biomarkers: breakdown.biomarker,
    nutrition: breakdown.food,
    exercise: breakdown.exercise,
    mind: breakdown.mind,
    sleep: breakdown.sleep,
  };

  return calculateGeis({ scores }, config);
}
