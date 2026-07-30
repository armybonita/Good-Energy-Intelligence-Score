import type { GeisAlgorithmConfig } from './types.ts';

/**
 * GEIS research configuration v1.
 *
 * Change weights or balancePenalty.lambda here, then increment version.
 * The engine validates that weights sum to 1.0 before calculating a score.
 */
export const GEIS_ALGORITHM_V1: GeisAlgorithmConfig = {
  version: 'geis-1.0.0-research',
  weights: {
    biomarkers: 0.25,
    nutrition: 0.20,
    exercise: 0.20,
    mind: 0.20,
    sleep: 0.15,
  },
  balancePenalty: {
    method: 'population-standard-deviation',
    lambda: 0.15,
  },
  missingDataMode: 'strict',
};
