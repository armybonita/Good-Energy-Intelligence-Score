# GEIS Algorithm v1

Copyright © 2026 Ahreum Hong. All rights reserved.

## Position in BODY Q™ / My Body IQ™

- **BODY Q™** is the user-facing experience and brand.
- **My Body IQ™** is the broader personal-health intelligence architecture.
- **GEIS** is the core energy sub-index. It is not a competing master brand.

## Formula

```text
Weighted Base Score
  = 0.25 × Biomarkers
  + 0.20 × Nutrition
  + 0.20 × Exercise
  + 0.20 × Mind
  + 0.15 × Sleep

Balance Penalty
  = λ × PopulationStdDev(Biomarkers, Nutrition, Exercise, Mind, Sleep)

Final GEIS
  = clamp(Weighted Base Score − Balance Penalty, 0, 100)
```

The provisional research value is `λ = 0.15`. It is a tunable research
parameter, not a clinically validated coefficient.

## Data-confidence rule

Every domain may include confidence from `0` to `1`. The engine returns the
weighted confidence separately. Confidence does not silently inflate or reduce
the health score.

Genomic information is excluded from the numeric GEIS total. It may be used for
personalization context, target ranges, or interpretation confidence only.

## Updating the algorithm

1. Edit `algorithm/config.ts`.
2. Keep all five weights summing to `1.0`.
3. Increment `version`.
4. Run `npm test`.
5. Record the validation cohort, outcome definition, and calibration evidence
   in a new algorithm version note before production use.

## Interpretation boundary

GEIS supports health and lifestyle decisions. It is not a medical diagnosis,
prescription, or clinically validated medical score.
