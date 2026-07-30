import assert from 'node:assert/strict';
import test from 'node:test';
import { GEIS_ALGORITHM_V1 } from './config.ts';
import {
  calculateGeis,
  calculateGeisFromDashboardBreakdown,
  validateConfig,
} from './geis.ts';

test('balanced domains have no balance penalty', () => {
  const result = calculateGeis({
    scores: {
      biomarkers: 80,
      nutrition: 80,
      exercise: 80,
      mind: 80,
      sleep: 80,
    },
  });

  assert.equal(result.weightedBaseScore, 80);
  assert.equal(result.balancePenalty, 0);
  assert.equal(result.finalGeis, 80);
});

test('current dashboard example evaluates to 81.78 and displays as 82', () => {
  const result = calculateGeisFromDashboardBreakdown({
    biomarker: 85,
    exercise: 78,
    mind: 88,
    sleep: 75,
    food: 84,
  });

  assert.equal(result.weightedBaseScore, 82.5);
  assert.equal(result.balancePenalty, 0.72);
  assert.equal(result.finalGeis, 81.78);
  assert.equal(Math.round(result.finalGeis), 82);
  assert.equal(result.bottleneck, 'sleep');
});

test('imbalance reduces the weighted base score', () => {
  const result = calculateGeis({
    scores: {
      biomarkers: 100,
      nutrition: 80,
      exercise: 80,
      mind: 80,
      sleep: 80,
    },
  });

  assert.ok(result.balancePenalty > 0);
  assert.ok(result.finalGeis < result.weightedBaseScore);
});

test('data confidence is weighted but does not change the health score', () => {
  const result = calculateGeis({
    scores: {
      biomarkers: 80,
      nutrition: 80,
      exercise: 80,
      mind: 80,
      sleep: 80,
    },
    confidence: {
      biomarkers: 1,
      nutrition: 0.5,
      exercise: 1,
      mind: 0.5,
      sleep: 0,
    },
    genomicContext: {
      available: true,
      source: 'consumer-genomics-csv',
    },
  });

  assert.equal(result.finalGeis, 80);
  assert.equal(result.dataConfidence, 0.65);
});

test('invalid weights are rejected before scoring', () => {
  assert.throws(
    () =>
      validateConfig({
        ...GEIS_ALGORITHM_V1,
        weights: {
          ...GEIS_ALGORITHM_V1.weights,
          biomarkers: 0.3,
        },
      }),
    /sum to 1.0/,
  );
});

test('domain scores outside 0-100 are rejected', () => {
  assert.throws(
    () =>
      calculateGeis({
        scores: {
          biomarkers: 101,
          nutrition: 80,
          exercise: 80,
          mind: 80,
          sleep: 80,
        },
      }),
    /between 0 and 100/,
  );
});
