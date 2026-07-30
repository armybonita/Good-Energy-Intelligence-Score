import React, { useMemo, useState } from 'react';
import { calculateGeis } from './algorithm/index.ts';
import type { DomainScores, GeisDomain } from './algorithm/types.ts';

const domainMeta: Array<{
  key: GeisDomain;
  label: string;
  weight: string;
  color: string;
  short: string;
}> = [
  {
    key: 'biomarkers',
    label: 'Biomarkers',
    weight: '25%',
    color: '#006b7a',
    short: 'Blood, glucose & recovery signals',
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    weight: '20%',
    color: '#17a78b',
    short: 'Meal quality & metabolic stability',
  },
  {
    key: 'exercise',
    label: 'Exercise',
    weight: '20%',
    color: '#0b6fd3',
    short: 'Movement, capacity & consistency',
  },
  {
    key: 'mind',
    label: 'Mind',
    weight: '20%',
    color: '#7a5cff',
    short: 'Stress load, mood & mental recovery',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    weight: '15%',
    color: '#233b73',
    short: 'Duration, regularity & restoration',
  },
];

const intelligenceCards = [
  {
    label: 'Good Energy',
    value: 83,
    detail: 'Daily capacity to generate and use energy',
  },
  {
    label: 'Metabolic',
    value: 72,
    detail: 'Glucose stability, body composition and GLP-1 context',
  },
  {
    label: 'Recovery',
    value: 67,
    detail: 'Sleep, stress and post-activity restoration',
  },
  {
    label: 'Longevity',
    value: 79,
    detail: 'Long-horizon resilience and healthy-age signals',
  },
];

const connectors = [
  {
    id: 'checkup',
    title: 'Health Checkup',
    detail: 'CSV, TXT, PDF or image',
    accept: '.csv,.txt,.pdf,image/*',
    icon: '01',
  },
  {
    id: 'genome',
    title: 'Genome',
    detail: 'Variant CSV or TXT',
    accept: '.csv,.txt',
    icon: '02',
  },
  {
    id: 'meal',
    title: 'Meal Photo',
    detail: 'JPG, PNG or HEIC',
    accept: 'image/*',
    icon: '03',
  },
  {
    id: 'wearable',
    title: 'Wearables',
    detail: 'Ring, watch or activity export',
    accept: '.csv,.txt,.json',
    icon: '04',
  },
];

function BodyQMark() {
  return (
    <div className="brand-lockup" aria-label="BODY Q">
      <svg
        className="brand-mark"
        viewBox="0 0 64 64"
        role="img"
        aria-label="BODY Q symbol"
      >
        <defs>
          <linearGradient id="bodyQGradient" x1="12" y1="8" x2="52" y2="56">
            <stop stopColor="#0ec7d8" />
            <stop offset="1" stopColor="#0b6fd3" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#071b33" />
        <circle
          cx="32"
          cy="32"
          r="20"
          fill="none"
          stroke="url(#bodyQGradient)"
          strokeWidth="3"
          strokeDasharray="96 30"
          strokeLinecap="round"
          transform="rotate(-28 32 32)"
        />
        <circle cx="32" cy="21" r="5" fill="#e8fbff" />
        <path
          d="M23 45c1.5-9 4.8-14 9-14s7.5 5 9 14"
          fill="none"
          stroke="#e8fbff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M45 42l7 7"
          stroke="#0ec7d8"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <strong>BODY Q</strong>
        <span>The Intelligence of Your Body</span>
      </div>
    </div>
  );
}

function getBodyState(score: number) {
  if (score >= 85) {
    return {
      label: 'Thriving',
      copy: 'Protect the routines that are working and watch for early drift.',
    };
  }
  if (score >= 70) {
    return {
      label: 'Building',
      copy: 'Your system is responding. One focused lever can improve balance.',
    };
  }
  if (score >= 55) {
    return {
      label: 'Rebalancing',
      copy: 'Reduce volatility and rebuild a stable daily rhythm.',
    };
  }
  return {
    label: 'Restoring',
    copy: 'Start with recovery, data quality and appropriate professional support.',
  };
}

function App() {
  const [dialScore, setDialScore] = useState(76);
  const [scores, setScores] = useState<DomainScores>({
    biomarkers: 82,
    nutrition: 74,
    exercise: 79,
    mind: 71,
    sleep: 66,
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const [glp1Mode, setGlp1Mode] = useState(false);

  const geis = useMemo(
    () =>
      calculateGeis({
        scores,
        confidence: {
          biomarkers: selectedFiles.checkup ? 1 : 0.65,
          nutrition: selectedFiles.meal ? 0.9 : 0.55,
          exercise: selectedFiles.wearable ? 0.95 : 0.65,
          mind: 0.65,
          sleep: selectedFiles.wearable ? 0.95 : 0.6,
        },
        genomicContext: {
          available: Boolean(selectedFiles.genome),
          source: selectedFiles.genome ? 'user-selected-file' : undefined,
        },
      }),
    [scores, selectedFiles],
  );

  const state = getBodyState(dialScore);
  const suggestedLever =
    geis.bottleneck === 'sleep'
      ? 'Move bedtime 30 minutes earlier for the next seven days.'
      : geis.bottleneck === 'nutrition'
        ? 'Anchor one meal with protein, vegetables and a consistent time.'
        : geis.bottleneck === 'mind'
          ? 'Add a ten-minute decompression block before your evening routine.'
          : geis.bottleneck === 'exercise'
            ? 'Add a short post-meal walk to your most sedentary day.'
            : 'Review your latest checkup signals before changing multiple habits.';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateScore = (domain: GeisDomain, value: number) => {
    setScores((current) => ({ ...current, [domain]: value }));
  };

  const handleFile = (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFiles((current) => ({ ...current, [id]: file.name }));
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand-link" href="#top">
          <BodyQMark />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#system">The System</a>
          <a href="#intelligence">Intelligence Lab</a>
          <a href="#connect">Connect Data</a>
          <a href="#trust">Trust</a>
        </nav>
        <button className="header-cta" onClick={() => scrollTo('intelligence')}>
          Try the Dial
        </button>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <p className="eyebrow">
              Human Energy Intelligence · Research Preview
            </p>
            <h1>
              Know your body.
              <span> Change your future.</span>
            </h1>
            <p className="hero-lede">
              BODY Q™ turns fragmented health signals into a clear body state,
              an explainable score and one action you can use today.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollTo('intelligence')}>
                Experience BODY Q
              </button>
              <button className="text-button" onClick={() => scrollTo('system')}>
                See how the system works
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hero-proof">
              <span>Browser-first</span>
              <span>Explainable scoring</span>
              <span>One actionable lever</span>
            </div>
          </div>

          <div className="dial-stage" aria-label="Interactive Body State Dial">
            <div
              className="score-orbit"
              style={{
                background: `conic-gradient(#0ec7d8 ${dialScore * 3.6}deg, #dfeaf0 0deg)`,
              }}
            >
              <div className="score-orbit-inner">
                <span className="dial-kicker">BODY STATE</span>
                <strong>{dialScore}</strong>
                <span className="dial-state">{state.label}</span>
              </div>
            </div>
            <p className="dial-copy">{state.copy}</p>
            <label className="dial-control">
              <span>Move the dial</span>
              <input
                type="range"
                min="35"
                max="96"
                value={dialScore}
                onChange={(event) => setDialScore(Number(event.target.value))}
              />
            </label>
            <div className="one-lever">
              <span>YOUR ONE LEVER</span>
              <strong>{suggestedLever}</strong>
            </div>
          </div>
        </section>

        <section id="system" className="system-section section-pad">
          <div className="section-heading">
            <p className="eyebrow">One system · Three clear layers</p>
            <h2>From body signals to better decisions.</h2>
            <p>
              The brand, intelligence architecture and energy engine each have
              one job—so the experience stays understandable.
            </p>
          </div>
          <div className="layer-grid">
            <article className="layer-card layer-card-primary">
              <span>01 · EXPERIENCE</span>
              <h3>BODY Q™</h3>
              <p>
                The user-facing experience: body state, meaning and a practical
                next action.
              </p>
            </article>
            <article className="layer-card">
              <span>02 · ARCHITECTURE</span>
              <h3>My Body IQ™</h3>
              <p>
                The personal-health intelligence layer combining energy,
                metabolism, recovery and longevity.
              </p>
            </article>
            <article className="layer-card">
              <span>03 · CORE ENGINE</span>
              <h3>GEIS</h3>
              <p>
                The explainable energy sub-index that rewards strength while
                accounting for imbalance.
              </p>
            </article>
          </div>

          <div className="iq-grid">
            {intelligenceCards.map((card) => (
              <article className="iq-card" key={card.label}>
                <div className="iq-value">
                  <span>{card.value}</span>
                  <small>/100</small>
                </div>
                <h3>{card.label} IQ</h3>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="intelligence" className="intelligence-section section-pad">
          <div className="lab-copy">
            <p className="eyebrow eyebrow-light">BODY Q™ Intelligence Lab</p>
            <h2>Balance over peaks.</h2>
            <p>
              Adjust the five domains. BODY Q recalculates the weighted base,
              balance penalty and final GEIS in real time.
            </p>
            <div className="formula-card">
              <span>FINAL GEIS</span>
              <strong>
                Weighted Base Score
                <br />
                − Balance Penalty
              </strong>
              <small>Algorithm {geis.algorithmVersion}</small>
            </div>
          </div>

          <div className="lab-panel">
            <div className="lab-result">
              <div>
                <span>GOOD ENERGY INTELLIGENCE SCORE</span>
                <strong>{Math.round(geis.finalGeis)}</strong>
              </div>
              <div className="result-tag">
                {getBodyState(Math.round(geis.finalGeis)).label}
              </div>
            </div>

            <div className="domain-controls">
              {domainMeta.map((domain) => (
                <label className="domain-row" key={domain.key}>
                  <div className="domain-label">
                    <span
                      className="domain-dot"
                      style={{ backgroundColor: domain.color }}
                    />
                    <span>
                      <strong>{domain.label}</strong>
                      <small>{domain.short}</small>
                    </span>
                    <em>{domain.weight}</em>
                    <b>{scores[domain.key]}</b>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={scores[domain.key]}
                    style={{ accentColor: domain.color }}
                    onChange={(event) =>
                      updateScore(domain.key, Number(event.target.value))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="calculation-strip">
              <div>
                <span>Weighted base</span>
                <strong>{geis.weightedBaseScore.toFixed(2)}</strong>
              </div>
              <div>
                <span>Balance penalty</span>
                <strong>−{geis.balancePenalty.toFixed(2)}</strong>
              </div>
              <div>
                <span>Data confidence</span>
                <strong>{Math.round(geis.dataConfidence * 100)}%</strong>
              </div>
              <div>
                <span>Priority domain</span>
                <strong className="capitalize">{geis.bottleneck}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="connect" className="connect-section section-pad">
          <div className="section-heading">
            <p className="eyebrow">Start with the data you already have</p>
            <h2>Connect your health story.</h2>
            <p>
              A public prototype for exploring the experience. Selected files
              remain in your browser and are not uploaded to a server.
            </p>
          </div>

          <div className="connector-grid">
            {connectors.map((connector) => (
              <label
                className={`connector-card ${
                  selectedFiles[connector.id] ? 'is-connected' : ''
                }`}
                key={connector.id}
              >
                <input
                  type="file"
                  accept={connector.accept}
                  onChange={(event) => handleFile(connector.id, event)}
                />
                <span className="connector-number">{connector.icon}</span>
                <h3>{connector.title}</h3>
                <p>{selectedFiles[connector.id] || connector.detail}</p>
                <strong>
                  {selectedFiles[connector.id] ? 'Selected locally ✓' : 'Choose a file'}
                </strong>
              </label>
            ))}
          </div>

          <div className="glp1-panel">
            <div>
              <p className="eyebrow eyebrow-light">Phase 1 beachhead</p>
              <h2>GLP-1 Care that understands change over time.</h2>
              <p>
                Bring medication context together with appetite, weight,
                composition, nutrition, activity and recovery—without turning
                one data point into a diagnosis.
              </p>
            </div>
            <div className="glp1-toggle">
              <span>Personalization mode</span>
              <button
                className={glp1Mode ? 'is-on' : ''}
                onClick={() => setGlp1Mode((current) => !current)}
                aria-pressed={glp1Mode}
              >
                <span />
              </button>
              <strong>{glp1Mode ? 'GLP-1 context on' : 'General mode'}</strong>
            </div>
            <div className="glp1-actions">
              <span>MONITOR</span>
              <span>GUIDE</span>
              <span>ESCALATE</span>
            </div>
          </div>
        </section>

        <section className="loop-section section-pad">
          <div className="section-heading">
            <p className="eyebrow">The BODY Q loop</p>
            <h2>Intelligence becomes useful when it closes the loop.</h2>
          </div>
          <div className="loop-grid">
            {[
              ['Measure', 'Bring signals into one body state.'],
              ['Explain', 'Show what changed and why it matters.'],
              ['Act', 'Choose one lever with the highest practical value.'],
              ['Learn', 'Compare response with your personal baseline.'],
            ].map(([title, copy], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="trust" className="trust-section section-pad">
          <div className="trust-copy">
            <p className="eyebrow">Designed for trust</p>
            <h2>Your body is not a black box—or a marketing score.</h2>
          </div>
          <div className="trust-grid">
            <article>
              <strong>Browser-first</strong>
              <p>Public demo selections stay on the device by default.</p>
            </article>
            <article>
              <strong>Explainable</strong>
              <p>Weights, penalty, confidence and version remain visible.</p>
            </article>
            <article>
              <strong>Genomics with restraint</strong>
              <p>
                Genomic context informs personalization, not direct score
                rewards or penalties.
              </p>
            </article>
            <article>
              <strong>Human oversight</strong>
              <p>
                Escalation and professional review remain part of responsible
                care.
              </p>
            </article>
          </div>
          <div className="medical-notice">
            BODY Q™ is a research prototype for health and lifestyle support.
            It is not a diagnosis, prescription or clinically validated medical
            score. Seek qualified medical care for symptoms, medication
            decisions or urgent concerns.
          </div>
        </section>
      </main>

      <footer>
        <BodyQMark />
        <p>
          BODY Q™ · My Body IQ™ · Good Energy Intelligence Score™
          <br />
          Copyright © 2026 Ahreum Hong. All rights reserved.
        </p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}

export default App;
