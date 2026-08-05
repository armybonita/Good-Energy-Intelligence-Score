# Good Energy Intelligence Score (GEIS)

Public bilingual research implementation of the BODY Q™ Good Energy Intelligence Score engine.

GEIS combines five health domains with an explicit cross-domain imbalance penalty:

```text
GEIS = 0.25 × Biomarkers
     + 0.20 × Nutrition
     + 0.20 × Exercise
     + 0.20 × Mind
     + 0.15 × Sleep
     − 0.15 × SD(five domains)
```

## Live public sites

- English: https://body-q-geis-engine.army78.chatgpt.site
- 한국어: https://body-q-geis-engine-kr.army78.chatgpt.site

The two sites link to each other through their EN / 한국어 language controls.

## Repository structure

```text
.
├── english/   # English public site
└── korean/    # Korean public site
```

Each application includes:

- an interactive five-domain GEIS calculator;
- an imbalance-penalty visualization;
- a pre-clinical transition-state simulator;
- an explainable Next Best Action generator;
- technical architecture and API documentation;
- wearable integration for Galaxy Watch/Ring, Apple Watch, CGM, and BLE sensors;
- adaptive 1-, 5-, and 15-minute sampling controls with the `/v1/devices/sampling-control` endpoint design.

## Local development

Node.js 22.13 or later is required.

```bash
cd english   # or: cd korean
npm ci
npm run dev
```

Build and test:

```bash
npm run build
npm test
```

The checked-in `.openai/hosting.json` files intentionally omit live Sites project identifiers. The Sites publishing workflow assigns the correct project identity at deployment time.

## Research and medical notice

This repository is a research and collaboration prototype. It is not a medical device, does not diagnose or treat disease, and must not replace professional medical judgment. Production use with health or wearable data requires appropriate consent, security, privacy, clinical validation, and regulatory review.

Patent rights may apply to the GEIS scoring, transition-state estimation, causal intervention guidance, and orchestration concepts described by this project. Publication of source code does not itself grant a patent license.
