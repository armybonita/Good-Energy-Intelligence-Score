"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type DomainKey = "biomarkers" | "nutrition" | "exercise" | "mind" | "sleep";
type DeviceKey = "samsung" | "apple" | "cgm" | "ble";
type EndpointKey = "ingest" | "calculate" | "simulate" | "recommend" | "device";
type EvidenceKind = "meal" | "checkup" | "exercise";

type EvidenceFile = { name: string; type: string; size: number; preview?: string };
type EvidenceRecord = {
  id: string; kind: EvidenceKind; label: string; fileName: string; domain: DomainKey;
  reviewedScore: number; previousScore: number; appliedScore: number; note: string; createdAt: string;
};

const domains: Array<{
  key: DomainKey;
  label: string;
  weight: number;
  color: string;
  short: string;
}> = [
  { key: "biomarkers", label: "Biomarkers", weight: 0.25, color: "#2667ff", short: "BIO" },
  { key: "nutrition", label: "Nutrition", weight: 0.2, color: "#00a88f", short: "NUT" },
  { key: "exercise", label: "Exercise", weight: 0.2, color: "#ef9d22", short: "EXE" },
  { key: "mind", label: "Mind", weight: 0.2, color: "#8c62e8", short: "MND" },
  { key: "sleep", label: "Sleep", weight: 0.15, color: "#e5576f", short: "SLP" },
];

const profiles: Array<{ name: string; values: Record<DomainKey, number> }> = [
  {
    name: "Balanced baseline",
    values: { biomarkers: 78, nutrition: 76, exercise: 80, mind: 75, sleep: 77 },
  },
  {
    name: "Hidden imbalance",
    values: { biomarkers: 88, nutrition: 74, exercise: 91, mind: 42, sleep: 55 },
  },
  {
    name: "Transition watch",
    values: { biomarkers: 58, nutrition: 51, exercise: 63, mind: 45, sleep: 39 },
  },
];

const deviceSources: Array<{ key: DeviceKey; name: string; signals: string; protocol: string }> = [
  { key: "samsung", name: "Galaxy Watch / Ring", signals: "HRV · sleep · activity", protocol: "Health SDK" },
  { key: "apple", name: "Apple Watch", signals: "HRV · heart rate · activity", protocol: "HealthKit" },
  { key: "cgm", name: "Continuous Glucose Monitor", signals: "glucose · variability · meal response", protocol: "Vendor API" },
  { key: "ble", name: "Research BLE Sensor", signals: "heart rate · temperature · motion", protocol: "BLE GATT" },
];

const evidenceTypes: Array<{ key: EvidenceKind; label: string; eyebrow: string; description: string; domain: DomainKey; accept: string }> = [
  { key: "meal", label: "Meal photo", eyebrow: "NUTRITION", description: "Upload a meal image, review its balance and apply it to the Nutrition domain.", domain: "nutrition", accept: "image/*" },
  { key: "checkup", label: "Health checkup", eyebrow: "BIOMARKERS", description: "Add a checkup image, PDF or table and confirm the reviewed Biomarkers score.", domain: "biomarkers", accept: "image/*,.pdf,.csv,.txt" },
  { key: "exercise", label: "Exercise record", eyebrow: "EXERCISE", description: "Upload a treadmill, running or activity record and reflect today’s session.", domain: "exercise", accept: "image/*,.pdf,.csv,.txt" },
];

const actionLibrary: Record<DomainKey, { action: string; reason: string; metric: string }> = {
  biomarkers: {
    action: "Keep meal timing stable for 48 hours and schedule a fasting biomarker re-check.",
    reason: "Biomarker instability is the largest current constraint on recovery-state confidence.",
    metric: "Track fasting glucose consistency and resting heart rate.",
  },
  nutrition: {
    action: "Build the next meal around protein, fibre and minimally processed carbohydrates.",
    reason: "Nutrition is the lowest-scoring modifiable domain in the current system state.",
    metric: "Log the meal and review the two-hour post-meal response.",
  },
  exercise: {
    action: "Take a 20-minute low-intensity walk within 60 minutes after the next meal.",
    reason: "A small movement dose offers a low-burden test of near-term metabolic responsiveness.",
    metric: "Compare post-meal glucose or heart-rate recovery with the personal baseline.",
  },
  mind: {
    action: "Complete ten minutes of paced breathing before the next high-stress work block.",
    reason: "Mind-state load is the clearest bottleneck and may be amplifying cross-domain imbalance.",
    metric: "Measure the change in HRV and perceived stress after the session.",
  },
  sleep: {
    action: "Set a fixed lights-out time tonight and protect an eight-hour sleep opportunity.",
    reason: "Sleep is the present bottleneck and the highest-leverage recovery input for the next cycle.",
    metric: "Review sleep duration, continuity and next-morning HRV.",
  },
};

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, value));

export default function Home() {
  const [scores, setScores] = useState<Record<DomainKey, number>>({
    biomarkers: 78,
    nutrition: 64,
    exercise: 82,
    mind: 58,
    sleep: 71,
  });
  const [lambda, setLambda] = useState(0.15);
  const [perturbation, setPerturbation] = useState(46);
  const [recovery, setRecovery] = useState(61);
  const [confidence, setConfidence] = useState(82);
  const [endpoint, setEndpoint] = useState<EndpointKey>("calculate");
  const [copied, setCopied] = useState(false);
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>("exercise");
  const [evidenceFile, setEvidenceFile] = useState<EvidenceFile | null>(null);
  const [evidenceScore, setEvidenceScore] = useState(78);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceLog, setEvidenceLog] = useState<EvidenceRecord[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Record<DeviceKey, boolean>>({
    samsung: true,
    apple: false,
    cgm: true,
    ble: false,
  });

  const metrics = useMemo(() => {
    const values = domains.map((domain) => scores[domain.key]);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const standardDeviation = Math.sqrt(
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
    );
    const weightedBase = domains.reduce(
      (sum, domain) => sum + scores[domain.key] * domain.weight,
      0,
    );
    const penalty = lambda * standardDeviation;
    const geis = clamp(weightedBase - penalty);
    const lowest = domains.reduce((current, domain) =>
      scores[domain.key] < scores[current.key] ? domain : current,
    );

    const resilienceDeficit = (100 - geis) / 100;
    const imbalanceRisk = clamp(standardDeviation / 25, 0, 1);
    const transitionRisk = clamp(
      100 *
        (0.3 * resilienceDeficit +
          0.22 * imbalanceRisk +
          0.23 * (perturbation / 100) +
          0.15 * ((100 - recovery) / 100) +
          0.1 * ((100 - confidence) / 100)),
      3,
      99,
    );
    const state = transitionRisk >= 60 ? "Transition candidate" : transitionRisk >= 35 ? "Watch" : "Stable";

    const nadir = clamp(geis - perturbation * 0.28 - standardDeviation * 0.14);
    const recoveryRate = 0.16 + (recovery / 100) * 0.55;
    const trajectory = Array.from({ length: 7 }, (_, index) => {
      if (index === 0) return geis;
      return clamp(nadir + (geis - nadir) * (1 - Math.exp(-(index - 1) * recoveryRate)));
    });

    return {
      mean,
      standardDeviation,
      weightedBase,
      penalty,
      geis,
      lowest,
      transitionRisk,
      state,
      trajectory,
    };
  }, [scores, lambda, perturbation, recovery, confidence]);

  const nextAction = useMemo(() => {
    if (confidence < 50) {
      return {
        action: "Collect one additional overnight recovery measurement before changing the plan.",
        reason: "Signal confidence is below the action threshold, so reducing uncertainty has higher expected value than a behavioural recommendation.",
        metric: "Reassess after a complete sleep, HRV and resting-heart-rate window.",
      };
    }
    return actionLibrary[metrics.lowest.key];
  }, [confidence, metrics.lowest.key]);

  const recommendedCadence = metrics.transitionRisk >= 60 ? 1 : metrics.transitionRisk >= 35 ? 5 : 15;
  const activeDevices = deviceSources.filter((device) => connectedDevices[device.key]);
  const activeEvidenceType = evidenceTypes.find((item) => item.key === evidenceKind) ?? evidenceTypes[0];
  const projectedEvidenceScore = Math.round(scores[activeEvidenceType.domain] * 0.65 + evidenceScore * 0.35);

  const apiExamples = useMemo(() => {
    const domainScores = Object.fromEntries(domains.map((domain) => [domain.key, scores[domain.key]]));
    return {
      ingest: {
        method: "POST",
        path: "/v1/evidence/ingest",
        request: { subject_id: "research-subject-042", evidence_type: evidenceKind, file_name: evidenceFile?.name ?? "treadmill-session.jpg", review: { target_domain: activeEvidenceType.domain, reviewed_score: evidenceScore, note: evidenceNote || "Participant-confirmed evidence" } },
        response: { status: "review_confirmed", provenance_retained: true, projected_domain_score: projectedEvidenceScore, geis_recalculation: "queued" },
      },
      calculate: {
        method: "POST",
        path: "/v1/geis/calculate",
        request: { subject_id: "research-subject-042", domain_scores: domainScores, lambda },
        response: {
          weighted_base: Number(metrics.weightedBase.toFixed(2)),
          imbalance_sd: Number(metrics.standardDeviation.toFixed(2)),
          imbalance_penalty: Number(metrics.penalty.toFixed(2)),
          geis: Number(metrics.geis.toFixed(2)),
          data_confidence: confidence / 100,
        },
      },
      simulate: {
        method: "POST",
        path: "/v1/transition/simulate",
        request: {
          subject_id: "research-subject-042",
          geis: Number(metrics.geis.toFixed(2)),
          perturbation_intensity: perturbation / 100,
          recovery_capacity: recovery / 100,
        },
        response: {
          state: metrics.state.toLowerCase().replace(" ", "_"),
          posterior_transition_probability: Number((metrics.transitionRisk / 100).toFixed(3)),
          seven_day_trajectory: metrics.trajectory.map((value) => Number(value.toFixed(1))),
        },
      },
      recommend: {
        method: "POST",
        path: "/v1/actions/recommend",
        request: {
          subject_id: "research-subject-042",
          bottleneck_domain: metrics.lowest.key,
          transition_probability: Number((metrics.transitionRisk / 100).toFixed(3)),
          safety_mode: "research_guidance",
        },
        response: {
          next_best_action: nextAction.action,
          rationale: nextAction.reason,
          observation_plan: nextAction.metric,
        },
      },
      device: {
        method: "POST",
        path: "/v1/devices/sampling-control",
        request: {
          subject_id: "research-subject-042",
          connected_devices: activeDevices.map((device) => device.key),
          transition_probability: Number((metrics.transitionRisk / 100).toFixed(3)),
          expected_information_gain: "adaptive",
        },
        response: {
          command: "update_sampling_cadence",
          cadence_minutes: recommendedCadence,
          target_devices: activeDevices.map((device) => device.key),
          fallback: "retain_last_safe_configuration",
        },
      },
    };
  }, [scores, lambda, metrics, confidence, perturbation, recovery, nextAction, activeDevices, recommendedCadence, evidenceKind, evidenceFile, evidenceScore, evidenceNote, activeEvidenceType.domain, projectedEvidenceScore]);

  const activeApi = apiExamples[endpoint];
  const apiText = `${activeApi.method} ${activeApi.path}\n\nREQUEST\n${JSON.stringify(activeApi.request, null, 2)}\n\nRESPONSE\n${JSON.stringify(activeApi.response, null, 2)}`;

  const chartPoints = metrics.trajectory
    .map((value, index) => `${40 + index * 92},${20 + (100 - value) * 1.65}`)
    .join(" ");
  const areaPoints = `40,185 ${chartPoints} 592,185`;

  const setDomainScore = (key: DomainKey, value: number) => {
    setScores((current) => ({ ...current, [key]: clamp(value) }));
  };

  const selectEvidenceKind = (kind: EvidenceKind) => {
    setEvidenceKind(kind); setEvidenceFile(null);
    setEvidenceScore(kind === "exercise" ? 82 : kind === "meal" ? 74 : 72); setEvidenceNote("");
  };

  const handleEvidenceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const setFile = (preview?: string) => setEvidenceFile({ name: file.name, type: file.type || "unknown", size: file.size, preview });
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFile(typeof reader.result === "string" ? reader.result : undefined);
      reader.readAsDataURL(file);
    } else setFile();
  };

  const applyEvidence = () => {
    if (!evidenceFile) return;
    const domain = activeEvidenceType.domain; const previousScore = scores[domain];
    const appliedScore = Math.round(previousScore * 0.65 + evidenceScore * 0.35);
    const record: EvidenceRecord = {
      id: `${Date.now()}-${evidenceKind}`, kind: evidenceKind, label: activeEvidenceType.label,
      fileName: evidenceFile.name, domain, reviewedScore: evidenceScore, previousScore, appliedScore,
      note: evidenceNote.trim() || "Participant-confirmed evidence",
      createdAt: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    };
    setScores((current) => ({ ...current, [domain]: appliedScore }));
    setConfidence((current) => Math.min(98, current + 4));
    setEvidenceLog((current) => [record, ...current].slice(0, 6));
    setEvidenceFile(null); setEvidenceNote("");
  };

  const copyApi = async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(apiText);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = apiText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const exportSnapshot = () => {
    const snapshot = {
      generated_at: new Date().toISOString(),
      research_use_only: true,
      inputs: { scores, lambda, perturbation, recovery, confidence, evidence: evidenceLog },
      outputs: {
        geis: Number(metrics.geis.toFixed(2)),
        weighted_base: Number(metrics.weightedBase.toFixed(2)),
        imbalance_sd: Number(metrics.standardDeviation.toFixed(2)),
        transition_probability: Number((metrics.transitionRisk / 100).toFixed(3)),
        state: metrics.state,
        next_best_action: nextAction,
      },
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "geis-research-snapshot.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BODY Q GEIS home">
          <span className="brand-mark">BQ</span>
          <span>BODY Q <em>Research</em></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#method">Method</a>
          <a href="#evidence">My Data</a>
          <a href="#lab">GEIS Lab</a>
          <a href="#transition">Transition</a>
          <a href="#devices">Wearables</a>
          <a href="#architecture">Architecture</a>
          <a href="#api">API</a>
        </nav>
        <div className="topbar-actions">
          <div className="language-switch" aria-label="Language selection">
            <span aria-current="page">EN</span><a href="https://body-q-geis-engine-kr.army78.chatgpt.site">한국어</a>
          </div>
          <button className="nav-cta" onClick={() => document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" })}>
            Open the lab
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Good Energy Intelligence Score</div>
          <h1>Measure balance.<br />Detect transition.<br /><strong>Guide the next move.</strong></h1>
          <p>
            GEIS is a research engine for quantifying five-domain health performance while
            explicitly penalising cross-domain imbalance. It turns multimodal observations into
            a comparable state, an early transition signal and one testable next action.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" })}>
              Explore the live engine <span>↘</span>
            </button>
            <a className="text-link" href="#architecture">View technical model →</a>
          </div>
          <div className="hero-meta">
            <span><b>5</b> health domains</span>
            <span><b>1</b> imbalance penalty</span>
            <span><b>1</b> next best action</span>
          </div>
        </div>

        <div className="hero-instrument" aria-label={`Current example GEIS ${metrics.geis.toFixed(0)}`}>
          <div className="instrument-label">LIVE RESEARCH SIGNAL</div>
          <div className="gauge" style={{ "--score": `${metrics.geis * 3.6}deg` } as React.CSSProperties}>
            <div className="gauge-inner">
              <span>GEIS</span>
              <strong>{metrics.geis.toFixed(0)}</strong>
              <small>of 100</small>
            </div>
          </div>
          <div className="mini-signal-row">
            <div><span>Base</span><strong>{metrics.weightedBase.toFixed(1)}</strong></div>
            <div><span>Penalty</span><strong>−{metrics.penalty.toFixed(1)}</strong></div>
            <div><span>State</span><strong>{metrics.state}</strong></div>
          </div>
          <div className="instrument-note">
            <span className={`state-dot ${metrics.state.toLowerCase().replace(" ", "-")}`} />
            Recalculates as the live research inputs change.
          </div>
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="section-heading light-heading">
          <span>01 / THE METHOD</span>
          <h2>A score that makes imbalance visible.</h2>
          <p>A high average can conceal a fragile system. GEIS measures both level and balance.</p>
        </div>
        <div className="formula-panel">
          <div className="formula-copy">
            <span className="formula-kicker">CORE EQUATION</span>
            <div className="formula">GEIS(t) = Σ w<sub>d</sub>S<sub>d,t</sub> − λB(t)</div>
            <p>
              The weighted base captures performance across biomarkers, nutrition, exercise,
              mind and sleep. The penalty term captures dispersion between those domains.
            </p>
          </div>
          <div className="formula-steps">
            <div><span>1</span><p><b>Standardise</b> domain signals to a 0–100 comparable scale.</p></div>
            <div><span>2</span><p><b>Weight</b> each domain by its research configuration.</p></div>
            <div><span>3</span><p><b>Penalise</b> cross-domain standard deviation by λ.</p></div>
            <div><span>4</span><p><b>Separate</b> score, state uncertainty and data confidence.</p></div>
          </div>
        </div>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="section-heading">
          <span>02 / PERSONAL MULTIMODAL INPUT</span>
          <h2>Upload today’s evidence. See it change the model.</h2>
          <p>Add a meal photo, health-check record or treadmill screenshot. Review the interpreted domain value before it is blended into GEIS.</p>
        </div>
        <div className="evidence-type-row" role="tablist" aria-label="Evidence type">
          {evidenceTypes.map((item) => <button key={item.key} role="tab" aria-selected={evidenceKind === item.key} onClick={() => selectEvidenceKind(item.key)}><span>{item.eyebrow}</span><strong>{item.label}</strong></button>)}
        </div>
        <div className="evidence-workspace">
          <div className="upload-card">
            <div className="upload-card-head"><div><span>STEP 1</span><h3>Select your file</h3></div><b>Local preview</b></div>
            <label className={evidenceFile ? "drop-zone has-file" : "drop-zone"}>
              <input type="file" accept={activeEvidenceType.accept} onChange={handleEvidenceFile} />
              {evidenceFile?.preview ? <Image src={evidenceFile.preview} alt={`Preview of ${evidenceFile.name}`} width={72} height={72} unoptimized /> : <div className="upload-symbol">＋</div>}
              <div><strong>{evidenceFile?.name ?? `Upload ${activeEvidenceType.label.toLowerCase()}`}</strong><p>{evidenceFile ? `${(evidenceFile.size / 1024).toFixed(1)} KB · ${evidenceFile.type}` : activeEvidenceType.description}</p></div>
              <span className="browse-pill">Choose file</span>
            </label>
            <p className="privacy-line">The file stays in this browser session. It is not saved to the public site or sent for medical diagnosis.</p>
          </div>
          <div className="review-card">
            <div className="upload-card-head"><div><span>STEP 2</span><h3>Review before applying</h3></div><b>{activeEvidenceType.eyebrow}</b></div>
            <div className="review-score"><div><label htmlFor="evidence-score">Confirmed evidence score</label><p>Set the 0–100 value after reviewing the uploaded record.</p></div><output htmlFor="evidence-score">{evidenceScore}</output></div>
            <input id="evidence-score" type="range" min="0" max="100" value={evidenceScore} onChange={(event) => setEvidenceScore(Number(event.target.value))} />
            <label className="evidence-note"><span>Optional note</span><textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder={evidenceKind === "exercise" ? "e.g. Treadmill 42 min, 5.1 km, moderate effort" : evidenceKind === "meal" ? "e.g. Protein, vegetables and whole grains" : "e.g. Reviewed with the latest annual checkup"} /></label>
            <div className="impact-preview"><div><span>Current {activeEvidenceType.eyebrow}</span><b>{scores[activeEvidenceType.domain]}</b></div><i>→</i><div><span>After evidence</span><b>{projectedEvidenceScore}</b></div></div>
            <button className="apply-evidence" disabled={!evidenceFile} onClick={applyEvidence}>Apply to GEIS and recalculate</button>
          </div>
        </div>
        <div className="evidence-log" aria-live="polite">
          <div className="evidence-log-head"><div><span>STEP 3</span><h3>Evidence reflected in the engine</h3></div><b>{evidenceLog.length} applied</b></div>
          {evidenceLog.length === 0 ? <div className="empty-evidence">No personal evidence has been applied yet. Upload today’s treadmill record to start.</div> : <div className="evidence-records">{evidenceLog.map((record) => <article key={record.id}><span>{record.label}</span><div><strong>{record.fileName}</strong><p>{record.note}</p></div><div className="record-change"><small>{record.previousScore}</small><i>→</i><b>{record.appliedScore}</b></div><time>{record.createdAt}</time></article>)}</div>}
        </div>
      </section>

      <section className="lab-section" id="lab">
        <div className="section-heading">
          <span>03 / INTERACTIVE GEIS LAB</span>
          <h2>Move the system. See what the average misses.</h2>
          <p>Adjust each domain or load a research profile. Every output updates immediately.</p>
        </div>

        <div className="profile-row" aria-label="Research profiles">
          <span>LOAD PROFILE</span>
          {profiles.map((profile) => (
            <button key={profile.name} onClick={() => setScores(profile.values)}>{profile.name}</button>
          ))}
        </div>

        <div className="lab-grid">
          <div className="control-card">
            <div className="card-title-row">
              <div><span>INPUT LAYER</span><h3>Five-domain signals</h3></div>
              <span className="live-pill">LIVE</span>
            </div>
            <div className="domain-controls">
              {domains.map((domain) => (
                <div className="domain-control" key={domain.key}>
                  <div className="domain-label">
                    <span className="domain-code" style={{ color: domain.color }}>{domain.short}</span>
                    <label htmlFor={domain.key}>{domain.label}</label>
                    <small>weight {domain.weight.toFixed(2)}</small>
                    <output htmlFor={domain.key}>{scores[domain.key]}</output>
                  </div>
                  <input
                    id={domain.key}
                    type="range"
                    min="0"
                    max="100"
                    value={scores[domain.key]}
                    onChange={(event) => setDomainScore(domain.key, Number(event.target.value))}
                    style={{ "--track-color": domain.color, "--range-progress": `${scores[domain.key]}%` } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
            <div className="lambda-control">
              <div>
                <label htmlFor="lambda">Imbalance sensitivity λ</label>
                <p>Controls how strongly cross-domain dispersion reduces the final score.</p>
              </div>
              <div className="compact-slider">
                <input id="lambda" type="range" min="0" max="0.5" step="0.01" value={lambda} onChange={(event) => setLambda(Number(event.target.value))} />
                <output htmlFor="lambda">{lambda.toFixed(2)}</output>
              </div>
            </div>
          </div>

          <div className="score-card">
            <div className="card-title-row">
              <div><span>OUTPUT LAYER</span><h3>Balance-adjusted score</h3></div>
              <button className="icon-button" onClick={exportSnapshot} aria-label="Export GEIS research snapshot">↓ JSON</button>
            </div>
            <div className="score-display">
              <div className="score-number"><span>GEIS</span><strong>{metrics.geis.toFixed(1)}</strong><small>/ 100</small></div>
              <div className="score-status"><span className={`state-dot ${metrics.state.toLowerCase().replace(" ", "-")}`} />{metrics.state}</div>
            </div>
            <div className="calculation-stack">
              <div><span>Weighted base</span><b>{metrics.weightedBase.toFixed(2)}</b></div>
              <div><span>Cross-domain SD</span><b>{metrics.standardDeviation.toFixed(2)}</b></div>
              <div className="penalty-row"><span>λ × imbalance</span><b>− {metrics.penalty.toFixed(2)}</b></div>
              <div className="total-row"><span>Balance-adjusted GEIS</span><b>{metrics.geis.toFixed(2)}</b></div>
            </div>
            <div className="confidence-line">
              <div><span>Data confidence</span><b>{confidence}%</b></div>
              <div className="confidence-track"><span style={{ width: `${confidence}%` }} /></div>
              <p>Displayed separately. Confidence never inflates or suppresses GEIS.</p>
            </div>
          </div>
        </div>

        <div className="imbalance-card">
          <div className="imbalance-intro">
            <span>IMBALANCE MAP</span>
            <h3>Where fragility concentrates</h3>
            <p>Bars show each domain against the five-domain mean of {metrics.mean.toFixed(1)}.</p>
          </div>
          <div className="imbalance-bars">
            {domains.map((domain) => {
              const deviation = scores[domain.key] - metrics.mean;
              return (
                <div className="balance-row" key={domain.key}>
                  <span>{domain.label}</span>
                  <div className="balance-track">
                    <i className="mean-marker" />
                    <b style={{ width: `${scores[domain.key]}%`, background: domain.color }} />
                  </div>
                  <strong className={deviation < 0 ? "negative" : "positive"}>{deviation >= 0 ? "+" : ""}{deviation.toFixed(1)}</strong>
                </div>
              );
            })}
          </div>
          <div className="bottleneck-callout">
            <span>Bottleneck domain</span>
            <strong>{metrics.lowest.label}</strong>
            <p>{metrics.standardDeviation > 15 ? "The high spread indicates material cross-domain imbalance." : "The domain spread remains within a moderate research range."}</p>
          </div>
        </div>
      </section>

      <section className="transition-section" id="transition">
        <div className="section-heading light-heading">
          <span>04 / TRANSITION-STATE SIMULATOR</span>
          <h2>From a static score to recovery dynamics.</h2>
          <p>Stress the current system, vary its recovery capacity and observe the seven-day trajectory.</p>
        </div>
        <div className="transition-grid">
          <div className="simulator-controls">
            <div className="simulation-control">
              <div><label htmlFor="perturbation">Perturbation intensity</label><output>{perturbation}</output></div>
              <input id="perturbation" type="range" min="0" max="100" value={perturbation} onChange={(event) => setPerturbation(Number(event.target.value))} />
              <p>Meal load, sleep restriction, stress, travel or medication-context change.</p>
            </div>
            <div className="simulation-control">
              <div><label htmlFor="recovery">Recovery capacity</label><output>{recovery}</output></div>
              <input id="recovery" type="range" min="0" max="100" value={recovery} onChange={(event) => setRecovery(Number(event.target.value))} />
              <p>Estimated speed of return toward the subject-specific baseline.</p>
            </div>
            <div className="simulation-control">
              <div><label htmlFor="confidence">Data confidence</label><output>{confidence}%</output></div>
              <input id="confidence" type="range" min="20" max="100" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} />
              <p>Signal quality, recency, missingness and model calibration.</p>
            </div>
            <div className="risk-result">
              <div><span>Posterior transition probability</span><strong>{metrics.transitionRisk.toFixed(0)}%</strong></div>
              <div className="risk-track"><span style={{ width: `${metrics.transitionRisk}%` }} /></div>
              <p className={`risk-label ${metrics.state.toLowerCase().replace(" ", "-")}`}>{metrics.state}</p>
            </div>
          </div>

          <div className="trajectory-card">
            <div className="trajectory-title"><div><span>SIMULATED STATE</span><h3>Seven-day recovery path</h3></div><b>Baseline {metrics.geis.toFixed(1)}</b></div>
            <div className="chart-wrap">
              <svg viewBox="0 0 640 220" preserveAspectRatio="none" role="img" aria-label="Seven-day simulated GEIS recovery trajectory">
                <defs>
                  <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7ee8d5" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#7ee8d5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 60, 100, 140, 180].map((y) => <line key={y} x1="40" y1={y} x2="592" y2={y} className="chart-gridline" />)}
                <polygon points={areaPoints} fill="url(#area-fill)" />
                <polyline points={chartPoints} className="chart-line" />
                {metrics.trajectory.map((value, index) => <circle key={index} cx={40 + index * 92} cy={20 + (100 - value) * 1.65} r="5" className="chart-point" />)}
              </svg>
              <div className="chart-labels">{metrics.trajectory.map((_, index) => <span key={index}>D{index}</span>)}</div>
            </div>
            <div className="trajectory-insight">
              <span>MODEL READING</span>
              <p>{metrics.state === "Transition candidate" ? "The simulated state remains sufficiently displaced to warrant persistent monitoring and a safety-constrained response." : metrics.state === "Watch" ? "Recovery is plausible, but the interaction between imbalance and perturbation supports closer measurement." : "The model projects a return toward the individual baseline without a persistent transition signal."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="device-section" id="devices">
        <div className="section-heading">
          <span>05 / WEARABLE DEVICE BRIDGE</span>
          <h2>Turn continuous signals into adaptive measurement.</h2>
          <p>Connect research-grade signal sources, retain device provenance and change sampling cadence when the transition model needs more information.</p>
        </div>
        <div className="device-layout">
          <div className="device-list">
            {deviceSources.map((device) => {
              const connected = connectedDevices[device.key];
              return (
                <article className={connected ? "device-card connected" : "device-card"} key={device.key}>
                  <div className="device-icon">{device.key === "samsung" ? "◎" : device.key === "apple" ? "◉" : device.key === "cgm" ? "⌁" : "⌁"}</div>
                  <div className="device-copy"><span>{device.protocol}</span><h3>{device.name}</h3><p>{device.signals}</p></div>
                  <button
                    className="device-toggle"
                    aria-pressed={connected}
                    onClick={() => setConnectedDevices((current) => ({ ...current, [device.key]: !current[device.key] }))}
                  >
                    {connected ? "Connected" : "Connect"}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="device-control-panel">
            <div className="device-panel-head"><span>ADAPTIVE SAMPLING CONTROL</span><b>{activeDevices.length} source{activeDevices.length === 1 ? "" : "s"} active</b></div>
            <div className="cadence-display"><span>Recommended cadence</span><strong>{recommendedCadence}<small> min</small></strong></div>
            <div className="cadence-scale" aria-label={`Recommended sampling cadence ${recommendedCadence} minutes`}>
              {[1, 5, 15].map((value) => <span className={recommendedCadence === value ? "active" : ""} key={value}>{value}m</span>)}
            </div>
            <div className="packet-preview">
              <span>LATEST NORMALISED PACKET</span>
              <code>{`{\n  "timestamp": "2026-08-05T10:42:00+09:00",\n  "sources": ${JSON.stringify(activeDevices.map((device) => device.key))},\n  "cadence_min": ${recommendedCadence},\n  "confidence": ${(confidence / 100).toFixed(2)}\n}`}</code>
            </div>
            <p className="device-disclaimer">Research connector prototype. Production connections require participant consent, vendor authorisation and the corresponding device SDK or API.</p>
          </div>
        </div>
      </section>

      <section className="action-section">
        <div className="action-number">06</div>
        <div className="action-content">
          <span>NEXT BEST ACTION</span>
          <h2>One move. Clear rationale. Measurable follow-up.</h2>
          <div className="action-card">
            <div className="action-badge">{confidence < 50 ? "MEASURE FIRST" : metrics.lowest.short}</div>
            <div className="action-main">
              <span>Recommended now</span>
              <h3>{nextAction.action}</h3>
            </div>
            <div className="action-why"><span>WHY THIS ONE</span><p>{nextAction.reason}</p></div>
            <div className="action-measure"><span>OBSERVATION PLAN</span><p>{nextAction.metric}</p></div>
          </div>
          <p className="safety-note">Research guidance only. The engine does not diagnose disease, prescribe treatment or determine medication dosage.</p>
        </div>
      </section>

      <section className="architecture-section" id="architecture">
        <div className="section-heading">
          <span>07 / TECHNICAL ARCHITECTURE</span>
          <h2>Built as a traceable research pipeline.</h2>
          <p>Each layer keeps provenance, uncertainty and version information available for validation.</p>
        </div>
        <div className="architecture-flow">
          {[
            ["01", "Multimodal fabric", "Clinical, wearable, meal-image, medication-context, genetic and epigenetic signals."],
            ["02", "Comparable objects", "Windowed features retain missingness, elapsed time, source and measurement uncertainty."],
            ["03", "Personal baseline", "Population priors adapt toward a subject-specific longitudinal distribution."],
            ["04", "State & GEIS engines", "Latent recovery dynamics, persistence rules and balance-adjusted scoring run separately."],
            ["05", "Causal guide", "Candidate actions are ranked by expected change, safety, burden and information gain."],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
        <div className="architecture-principles">
          <div><span>PROVENANCE</span><b>Source-aware</b><p>Every feature retains its origin, time window and preprocessing version.</p></div>
          <div><span>UNCERTAINTY</span><b>Never hidden</b><p>Confidence is reported separately from the health score and action value.</p></div>
          <div><span>CAUSALITY</span><b>Testable</b><p>Recommendations are framed as observable N-of-1 hypotheses, not correlations alone.</p></div>
          <div><span>SAFETY</span><b>Constrained</b><p>Low confidence or unresolved conflict routes the system toward additional measurement.</p></div>
        </div>
      </section>

      <section className="api-section" id="api">
        <div className="api-intro">
          <span>08 / RESEARCH API</span>
          <h2>Take the current model into a study workflow.</h2>
          <p>The interface below mirrors the live values in this page, making the engine logic easy to inspect and discuss with collaborators.</p>
          <div className="api-notes"><span>JSON over HTTPS</span><span>Versioned models</span><span>Subject-pseudonymous</span></div>
        </div>
        <div className="api-console">
          <div className="api-tabs" role="tablist" aria-label="API examples">
            {([
              ["ingest", "Ingest evidence"],
              ["calculate", "Calculate GEIS"],
              ["simulate", "Simulate transition"],
              ["recommend", "Recommend action"],
              ["device", "Control devices"],
            ] as Array<[EndpointKey, string]>).map(([key, label]) => (
              <button key={key} role="tab" aria-selected={endpoint === key} onClick={() => setEndpoint(key)}>{label}</button>
            ))}
          </div>
          <div className="api-path"><span>{activeApi.method}</span><code>{activeApi.path}</code><button onClick={copyApi}>{copied ? "Copied" : "Copy example"}</button></div>
          <pre aria-label="API request and response example"><code>{apiText}</code></pre>
        </div>
      </section>

      <section className="research-section">
        <div>
          <span>FOR RESEARCHERS & COLLABORATORS</span>
          <h2>Bring your cohort, sensor or intervention study.</h2>
        </div>
        <p>
          GEIS is designed for prospective validation across metabolic health, recovery,
          behavioural intervention and longitudinal digital-biomarker research. The next phase
          is evidence: calibration, external validation, subgroup analysis and real-world N-of-1 studies.
        </p>
        <button onClick={exportSnapshot}>Download research snapshot <span>↓</span></button>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">BQ</span><span>BODY Q <em>Research</em></span></div>
        <p>Good Energy Intelligence Score · Research interface</p>
        <p>© 2026 BODY Q. Research use only.</p>
      </footer>
    </main>
  );
}
