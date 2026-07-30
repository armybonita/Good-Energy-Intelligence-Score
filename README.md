# BODY Q™ — The Intelligence of Your Body

Public research prototype connecting the BODY Q™ experience, the My Body IQ™
personal-health intelligence architecture, and the Good Energy Intelligence
Score™ (GEIS).

## Brand and product hierarchy

1. **BODY Q™** — the user-facing experience: body state, explanation and one
   actionable lever.
2. **My Body IQ™** — the broader intelligence architecture: Good Energy,
   Metabolic, Recovery and Longevity IQ.
3. **GEIS** — the core energy engine using five weighted domains and a balance
   penalty.

## Public homepage experience

- Interactive Body State Dial
- Live GEIS laboratory with adjustable five-domain inputs
- Health checkup, genome, meal-photo and wearable file selection
- GLP-1 personalization mode
- Measure → Explain → Act → Learn loop
- Browser-first privacy and responsible-use boundaries
- Responsive navy–cyan precision-health design

The public file selectors record only the selected filename in browser memory.
They do not upload, parse or persist health data.

## GEIS algorithm v1

```text
Weighted Base Score
  = 0.25 × Biomarkers
  + 0.20 × Nutrition
  + 0.20 × Exercise
  + 0.20 × Mind
  + 0.15 × Sleep

Final GEIS
  = Weighted Base Score − 0.15 × Population Standard Deviation
```

Configuration is versioned in
[`algorithm/config.ts`](algorithm/config.ts). Full assumptions and updating
instructions are in [`docs/ALGORITHM.md`](docs/ALGORITHM.md).

Genomic context may support personalization and confidence. It is not directly
added to or subtracted from the GEIS total.

## Run locally

Prerequisite: Node.js 22 or later.

```bash
npm install
npm run check
npm run dev
```

## Research boundary

BODY Q™ is for health and lifestyle support research. It is not a medical
diagnosis, prescription or clinically validated medical score.

Copyright © 2026 Ahreum Hong. All rights reserved. See [`NOTICE`](NOTICE).
