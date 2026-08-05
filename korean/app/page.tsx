"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type DomainKey = "biomarkers" | "nutrition" | "exercise" | "mind" | "sleep";
type DeviceKey = "samsung" | "apple" | "cgm" | "ble";
type EndpointKey = "ingest" | "calculate" | "simulate" | "recommend" | "device";
type EvidenceKind = "meal" | "checkup" | "exercise";
type EvidenceFile = { name: string; type: string; size: number; preview?: string };
type EvidenceRecord = { id: string; kind: EvidenceKind; label: string; fileName: string; domain: DomainKey; reviewedScore: number; previousScore: number; appliedScore: number; note: string; createdAt: string };

const domains: Array<{
  key: DomainKey;
  label: string;
  weight: number;
  color: string;
  short: string;
}> = [
  { key: "biomarkers", label: "생체지표", weight: 0.25, color: "#2667ff", short: "BIO" },
  { key: "nutrition", label: "영양", weight: 0.2, color: "#00a88f", short: "NUT" },
  { key: "exercise", label: "운동", weight: 0.2, color: "#ef9d22", short: "EXE" },
  { key: "mind", label: "마음", weight: 0.2, color: "#8c62e8", short: "MND" },
  { key: "sleep", label: "수면", weight: 0.15, color: "#e5576f", short: "SLP" },
];

const profiles: Array<{ name: string; values: Record<DomainKey, number> }> = [
  {
    name: "균형 기준선",
    values: { biomarkers: 78, nutrition: 76, exercise: 80, mind: 75, sleep: 77 },
  },
  {
    name: "숨은 불균형",
    values: { biomarkers: 88, nutrition: 74, exercise: 91, mind: 42, sleep: 55 },
  },
  {
    name: "전환 주의",
    values: { biomarkers: 58, nutrition: 51, exercise: 63, mind: 45, sleep: 39 },
  },
];

const deviceSources: Array<{ key: DeviceKey; name: string; signals: string; protocol: string }> = [
  { key: "samsung", name: "갤럭시 워치·링", signals: "HRV · 수면 · 활동", protocol: "Health SDK" },
  { key: "apple", name: "애플 워치", signals: "HRV · 심박수 · 활동", protocol: "HealthKit" },
  { key: "cgm", name: "연속혈당측정기", signals: "혈당 · 변동성 · 식사반응", protocol: "Vendor API" },
  { key: "ble", name: "연구용 BLE 센서", signals: "심박수 · 체온 · 움직임", protocol: "BLE GATT" },
];

const evidenceTypes: Array<{ key: EvidenceKind; label: string; eyebrow: string; icon: string; hint: string; domain: DomainKey; accept: string }> = [
  { key: "meal", label: "식사", eyebrow: "영양", icon: "🍽️", hint: "사진", domain: "nutrition", accept: "image/*" },
  { key: "checkup", label: "건강검진", eyebrow: "생체지표", icon: "🧾", hint: "사진 · PDF · CSV", domain: "biomarkers", accept: "image/*,.pdf,.csv,.txt" },
  { key: "exercise", label: "운동", eyebrow: "운동", icon: "🏃", hint: "러닝머신 · 러닝 · 활동", domain: "exercise", accept: "image/*,.pdf,.csv,.txt" },
];

const actionLibrary: Record<DomainKey, { action: string; reason: string; metric: string }> = {
  biomarkers: {
    action: "48시간 동안 식사시간을 일정하게 유지하고 공복 생체지표를 다시 측정하세요.",
    reason: "현재 생체지표의 변동성이 회복상태 판단의 가장 큰 제약요인입니다.",
    metric: "공복혈당의 일관성과 안정시 심박수를 추적하세요.",
  },
  nutrition: {
    action: "다음 식사는 단백질·식이섬유·최소가공 탄수화물을 중심으로 구성하세요.",
    reason: "현재 상태에서 영양은 개선 가능한 영역 중 점수가 가장 낮습니다.",
    metric: "식사를 기록하고 식후 2시간 반응을 확인하세요.",
  },
  exercise: {
    action: "다음 식사 후 60분 이내에 20분간 저강도 걷기를 하세요.",
    reason: "부담이 적은 운동으로 단기 대사반응성을 확인할 수 있습니다.",
    metric: "식후 혈당 또는 심박수 회복을 개인 기준선과 비교하세요.",
  },
  mind: {
    action: "다음 고강도 업무를 시작하기 전 10분간 호흡 훈련을 하세요.",
    reason: "마음 영역의 부담이 가장 뚜렷한 병목이며 영역 간 불균형을 키울 수 있습니다.",
    metric: "훈련 후 HRV와 주관적 스트레스의 변화를 측정하세요.",
  },
  sleep: {
    action: "오늘 취침시간을 고정하고 8시간의 수면 기회를 확보하세요.",
    reason: "현재 수면이 병목이며 다음 회복주기에 가장 큰 영향을 줄 수 있습니다.",
    metric: "수면시간·연속성·다음 날 아침 HRV를 확인하세요.",
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
        action: "계획을 바꾸기 전에 하룻밤의 회복 데이터를 추가로 측정하세요.",
        reason: "데이터 신뢰도가 행동 임계값보다 낮으므로 행동 권고보다 불확실성을 줄이는 것이 우선입니다.",
        metric: "수면·HRV·안정시 심박수 측정이 완료된 후 다시 평가하세요.",
      };
    }
    return actionLibrary[metrics.lowest.key];
  }, [confidence, metrics.lowest.key]);

  const stateKo =
    metrics.state === "Transition candidate" ? "전환 후보" : metrics.state === "Watch" ? "주의" : "안정";
  const recommendedCadence = metrics.transitionRisk >= 60 ? 1 : metrics.transitionRisk >= 35 ? 5 : 15;
  const activeDevices = deviceSources.filter((device) => connectedDevices[device.key]);
  const activeEvidenceType = evidenceTypes.find((item) => item.key === evidenceKind) ?? evidenceTypes[0];
  const projectedEvidenceScore = Math.round(scores[activeEvidenceType.domain] * 0.65 + evidenceScore * 0.35);
  const activeEvidenceDomain = domains.find((domain) => domain.key === activeEvidenceType.domain)?.label ?? "영역";

  const apiExamples = useMemo(() => {
    const domainScores = Object.fromEntries(domains.map((domain) => [domain.key, scores[domain.key]]));
    return {
      ingest: {
        method: "POST", path: "/v1/evidence/ingest",
        request: { subject_id: "research-subject-042", evidence_type: evidenceKind, file_name: evidenceFile?.name ?? "treadmill-session.jpg", review: { target_domain: activeEvidenceType.domain, reviewed_score: evidenceScore, note: evidenceNote || "사용자가 확인한 근거자료" } },
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
  const apiText = `${activeApi.method} ${activeApi.path}\n\n요청\n${JSON.stringify(activeApi.request, null, 2)}\n\n응답\n${JSON.stringify(activeApi.response, null, 2)}`;

  const chartPoints = metrics.trajectory
    .map((value, index) => `${40 + index * 92},${20 + (100 - value) * 1.65}`)
    .join(" ");
  const areaPoints = `40,185 ${chartPoints} 592,185`;

  const setDomainScore = (key: DomainKey, value: number) => {
    setScores((current) => ({ ...current, [key]: clamp(value) }));
  };

  const selectEvidenceKind = (kind: EvidenceKind) => { setEvidenceKind(kind); setEvidenceFile(null); setEvidenceScore(kind === "exercise" ? 82 : kind === "meal" ? 74 : 72); setEvidenceNote(""); };
  const handleEvidenceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const setFile = (preview?: string) => setEvidenceFile({ name: file.name, type: file.type || "unknown", size: file.size, preview });
    if (file.type.startsWith("image/")) { const reader = new FileReader(); reader.onload = () => setFile(typeof reader.result === "string" ? reader.result : undefined); reader.readAsDataURL(file); } else setFile();
  };
  const applyEvidence = () => {
    if (!evidenceFile) return;
    const domain = activeEvidenceType.domain; const previousScore = scores[domain]; const appliedScore = Math.round(previousScore * 0.65 + evidenceScore * 0.35);
    const record: EvidenceRecord = { id: `${Date.now()}-${evidenceKind}`, kind: evidenceKind, label: activeEvidenceType.label, fileName: evidenceFile.name, domain, reviewedScore: evidenceScore, previousScore, appliedScore, note: evidenceNote.trim() || "사용자가 확인한 근거자료", createdAt: new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) };
    setScores((current) => ({ ...current, [domain]: appliedScore })); setConfidence((current) => Math.min(98, current + 4)); setEvidenceLog((current) => [record, ...current].slice(0, 6)); setEvidenceFile(null); setEvidenceNote("");
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
        <a className="brand" href="#top" aria-label="BODY Q GEIS 홈">
          <span className="brand-mark">BQ</span>
          <span>BODY Q <em>리서치</em></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#evidence">데이터 추가</a>
          <a href="#lab">나의 GEIS</a>
          <a href="#devices">웨어러블</a>
          <a href="#architecture">연구정보</a>
        </nav>
        <div className="topbar-actions">
          <div className="language-switch" aria-label="언어 선택">
            <a href="https://body-q-geis-engine.army78.chatgpt.site">EN</a><span aria-current="page">한국어</span>
          </div>
          <button className="nav-cta" onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })}>
            데이터 추가
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Good Energy Intelligence Score</div>
          <h1>나의 데이터.<br /><strong>단 하나의 다음 행동.</strong></h1>
          <p>식사·건강검진·운동 기록을 올리면 GEIS가 변화를 보여주고 다음 행동을 안내합니다.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" })}>
              오늘의 데이터 추가 <span>↘</span>
            </button>
            <a className="text-link" href="#lab">나의 GEIS 보기 →</a>
          </div>
          <div className="hero-meta">
            <span><b>1</b> 데이터 추가</span>
            <span><b>2</b> 점수 확인</span>
            <span><b>3</b> 한 가지 행동</span>
          </div>
        </div>

        <div className="hero-instrument" aria-label={`현재 예시 GEIS ${metrics.geis.toFixed(0)}`}>
          <div className="instrument-label">나의 GEIS</div>
          <div className="gauge" style={{ "--score": `${metrics.geis * 3.6}deg` } as React.CSSProperties}>
            <div className="gauge-inner">
              <span>GEIS</span>
              <strong>{metrics.geis.toFixed(0)}</strong>
              <small>100점 만점</small>
            </div>
          </div>
          <div className="mini-signal-row">
            <div><span>기본점수</span><strong>{metrics.weightedBase.toFixed(1)}</strong></div>
            <div><span>패널티</span><strong>−{metrics.penalty.toFixed(1)}</strong></div>
            <div><span>상태</span><strong>{stateKo}</strong></div>
          </div>
          <div className="instrument-note">
            <span className={`state-dot ${metrics.state.toLowerCase().replace(" ", "-")}`} />
            나의 데이터로 바로 갱신됩니다.
          </div>
        </div>
      </section>

      <section className="method-section" id="method">
        <details className="method-disclosure">
          <summary><span>GEIS는 어떻게 계산되나요?</span><b>수식 보기 ＋</b></summary>
          <div className="formula-panel">
            <div className="formula-copy"><span className="formula-kicker">균형 조정 점수</span><div className="formula">GEIS = 가중 점수 − 불균형</div></div>
            <div className="formula-steps compact-formula-steps">
              <div><span>1</span><p>다섯 건강영역을 합산합니다.</p></div>
              <div><span>2</span><p>불균형 패널티를 차감합니다.</p></div>
            </div>
          </div>
        </details>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="section-heading friendly-heading"><span>나의 데이터 추가</span><h2>무엇을 추가할까요?</h2></div>
        <div className="evidence-type-row" role="tablist" aria-label="자료 유형">{evidenceTypes.map((item) => <button key={item.key} role="tab" aria-selected={evidenceKind === item.key} onClick={() => selectEvidenceKind(item.key)}><i>{item.icon}</i><strong>{item.label}</strong><small>{item.hint}</small></button>)}</div>
        <div className="simple-evidence-card">
          <label className={evidenceFile ? "quick-upload has-file" : "quick-upload"}><input type="file" accept={activeEvidenceType.accept} onChange={handleEvidenceFile} />{evidenceFile?.preview ? <Image src={evidenceFile.preview} alt={`${evidenceFile.name} 미리보기`} width={96} height={96} unoptimized /> : <span className="quick-upload-icon">{activeEvidenceType.icon}</span>}<div><strong>{evidenceFile?.name ?? `${activeEvidenceType.label} 자료 올리기`}</strong><small>{evidenceFile ? `${(evidenceFile.size / 1024).toFixed(0)} KB` : activeEvidenceType.hint}</small></div><b>{evidenceFile ? "변경" : "선택"}</b></label>
          <div className="quick-review"><div className="quick-score-title"><label htmlFor="evidence-score">오늘은 어땠나요?</label><output htmlFor="evidence-score">{evidenceScore}</output></div><input id="evidence-score" type="range" min="0" max="100" value={evidenceScore} onChange={(event) => setEvidenceScore(Number(event.target.value))} /><div className="quick-impact"><span>{activeEvidenceDomain}</span><strong>{scores[activeEvidenceType.domain]} <i>→</i> {projectedEvidenceScore}</strong></div><button className="apply-evidence" disabled={!evidenceFile} onClick={applyEvidence}>나의 GEIS 업데이트</button></div>
          <details className="quick-note"><summary>메모 추가</summary><textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder="선택사항" /></details>
          <p className="privacy-line">🔒 이 브라우저에서만 사용되며 공개 저장되지 않습니다.</p>
        </div>
        {evidenceLog[0] && <div className="evidence-success" aria-live="polite"><span>✓</span><div><strong>GEIS에 반영했습니다</strong><p>{evidenceLog[0].fileName} · {evidenceLog[0].previousScore} → {evidenceLog[0].appliedScore}</p></div><b>GEIS {metrics.geis.toFixed(1)}</b></div>}
      </section>

      <section className="lab-section" id="lab">
        <div className="section-heading">
          <span>03 / 인터랙티브 GEIS 랩</span>
          <h2>값을 움직이면 평균이 놓친 것이 보입니다.</h2>
          <p>각 영역을 조정하거나 연구 프로필을 불러오세요. 모든 결과가 즉시 갱신됩니다.</p>
        </div>

        <div className="profile-row" aria-label="연구 프로필">
          <span>프로필 불러오기</span>
          {profiles.map((profile) => (
            <button key={profile.name} onClick={() => setScores(profile.values)}>{profile.name}</button>
          ))}
        </div>

        <div className="lab-grid">
          <div className="control-card">
            <div className="card-title-row">
              <div><span>입력 계층</span><h3>다섯 가지 영역 신호</h3></div>
              <span className="live-pill">실시간</span>
            </div>
            <div className="domain-controls">
              {domains.map((domain) => (
                <div className="domain-control" key={domain.key}>
                  <div className="domain-label">
                    <span className="domain-code" style={{ color: domain.color }}>{domain.short}</span>
                    <label htmlFor={domain.key}>{domain.label}</label>
                    <small>가중치 {domain.weight.toFixed(2)}</small>
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
                <label htmlFor="lambda">불균형 민감도 λ</label>
                <p>영역 간 편차가 최종점수를 얼마나 감소시킬지 조정합니다.</p>
              </div>
              <div className="compact-slider">
                <input id="lambda" type="range" min="0" max="0.5" step="0.01" value={lambda} onChange={(event) => setLambda(Number(event.target.value))} />
                <output htmlFor="lambda">{lambda.toFixed(2)}</output>
              </div>
            </div>
          </div>

          <div className="score-card">
            <div className="card-title-row">
              <div><span>출력 계층</span><h3>균형 조정 점수</h3></div>
              <button className="icon-button" onClick={exportSnapshot} aria-label="GEIS 연구 스냅샷 내려받기">↓ JSON</button>
            </div>
            <div className="score-display">
              <div className="score-number"><span>GEIS</span><strong>{metrics.geis.toFixed(1)}</strong><small>/ 100</small></div>
              <div className="score-status"><span className={`state-dot ${metrics.state.toLowerCase().replace(" ", "-")}`} />{stateKo}</div>
            </div>
            <div className="calculation-stack">
              <div><span>가중 기본점수</span><b>{metrics.weightedBase.toFixed(2)}</b></div>
              <div><span>영역 간 표준편차</span><b>{metrics.standardDeviation.toFixed(2)}</b></div>
              <div className="penalty-row"><span>λ × 불균형</span><b>− {metrics.penalty.toFixed(2)}</b></div>
              <div className="total-row"><span>균형 조정 GEIS</span><b>{metrics.geis.toFixed(2)}</b></div>
            </div>
            <div className="confidence-line">
              <div><span>데이터 신뢰도</span><b>{confidence}%</b></div>
              <div className="confidence-track"><span style={{ width: `${confidence}%` }} /></div>
              <p>별도 지표로 표시되며 GEIS를 직접 높이거나 낮추지 않습니다.</p>
            </div>
          </div>
        </div>

        <div className="imbalance-card">
          <div className="imbalance-intro">
            <span>불균형 지도</span>
            <h3>취약성이 집중된 영역</h3>
            <p>각 영역을 다섯 영역의 평균 {metrics.mean.toFixed(1)}와 비교합니다.</p>
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
            <span>병목영역</span>
            <strong>{metrics.lowest.label}</strong>
            <p>{metrics.standardDeviation > 15 ? "영역 간 편차가 커서 유의미한 불균형이 나타납니다." : "영역 간 편차가 중간 수준의 연구범위에 있습니다."}</p>
          </div>
        </div>
      </section>

      <section className="transition-section" id="transition">
        <div className="section-heading light-heading">
          <span>04 / 전환상태 시뮬레이터</span>
          <h2>정적인 점수에서 회복동역학으로.</h2>
          <p>현재 시스템에 교란을 가하고 회복역량을 바꾸면서 7일간의 궤적을 관찰하세요.</p>
        </div>
        <div className="transition-grid">
          <div className="simulator-controls">
            <div className="simulation-control">
              <div><label htmlFor="perturbation">교란 강도</label><output>{perturbation}</output></div>
              <input id="perturbation" type="range" min="0" max="100" value={perturbation} onChange={(event) => setPerturbation(Number(event.target.value))} />
              <p>식사부하·수면제한·스트레스·여행·약물맥락 변화 등을 의미합니다.</p>
            </div>
            <div className="simulation-control">
              <div><label htmlFor="recovery">회복역량</label><output>{recovery}</output></div>
              <input id="recovery" type="range" min="0" max="100" value={recovery} onChange={(event) => setRecovery(Number(event.target.value))} />
              <p>개인 기준선으로 되돌아가는 추정 속도입니다.</p>
            </div>
            <div className="simulation-control">
              <div><label htmlFor="confidence">데이터 신뢰도</label><output>{confidence}%</output></div>
              <input id="confidence" type="range" min="20" max="100" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} />
              <p>신호품질·최신성·결측도·모델 보정도를 반영합니다.</p>
            </div>
            <div className="risk-result">
              <div><span>사후 전환확률</span><strong>{metrics.transitionRisk.toFixed(0)}%</strong></div>
              <div className="risk-track"><span style={{ width: `${metrics.transitionRisk}%` }} /></div>
              <p className={`risk-label ${metrics.state.toLowerCase().replace(" ", "-")}`}>{stateKo}</p>
            </div>
          </div>

          <div className="trajectory-card">
            <div className="trajectory-title"><div><span>시뮬레이션 상태</span><h3>7일 회복경로</h3></div><b>기준선 {metrics.geis.toFixed(1)}</b></div>
            <div className="chart-wrap">
              <svg viewBox="0 0 640 220" preserveAspectRatio="none" role="img" aria-label="7일간의 GEIS 회복 시뮬레이션 궤적">
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
              <span>모델 해석</span>
              <p>{metrics.state === "Transition candidate" ? "시뮬레이션 상태의 이탈이 지속되어 반복 측정과 안전제약이 적용된 대응이 필요합니다." : metrics.state === "Watch" ? "회복 가능성은 있으나 불균형과 교란의 상호작용을 더 면밀히 측정해야 합니다." : "지속적인 전환신호 없이 개인 기준선으로 회복할 것으로 예측됩니다."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="device-section" id="devices">
        <div className="section-heading">
          <span>05 / 웨어러블 디바이스 브리지</span>
          <h2>연속신호를 적응형 측정으로 연결합니다.</h2>
          <p>연구용 신호장비의 출처정보를 보존하고, 전환모델에 더 많은 정보가 필요할 때 샘플링 주기를 조정합니다.</p>
        </div>
        <div className="device-layout">
          <div className="device-list">
            {deviceSources.map((device) => {
              const connected = connectedDevices[device.key];
              return (
                <article className={connected ? "device-card connected" : "device-card"} key={device.key}>
                  <div className="device-icon">{device.key === "samsung" ? "◎" : device.key === "apple" ? "◉" : "⌁"}</div>
                  <div className="device-copy"><span>{device.protocol}</span><h3>{device.name}</h3><p>{device.signals}</p></div>
                  <button
                    className="device-toggle"
                    aria-pressed={connected}
                    onClick={() => setConnectedDevices((current) => ({ ...current, [device.key]: !current[device.key] }))}
                  >
                    {connected ? "연결됨" : "연결"}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="device-control-panel">
            <div className="device-panel-head"><span>적응형 샘플링 제어</span><b>{activeDevices.length}개 장비 활성화</b></div>
            <div className="cadence-display"><span>권장 샘플링 주기</span><strong>{recommendedCadence}<small>분</small></strong></div>
            <div className="cadence-scale" aria-label={`권장 샘플링 주기 ${recommendedCadence}분`}>
              {[1, 5, 15].map((value) => <span className={recommendedCadence === value ? "active" : ""} key={value}>{value}분</span>)}
            </div>
            <div className="packet-preview">
              <span>최근 정규화 패킷</span>
              <code>{`{\n  "timestamp": "2026-08-05T10:42:00+09:00",\n  "sources": ${JSON.stringify(activeDevices.map((device) => device.key))},\n  "cadence_min": ${recommendedCadence},\n  "confidence": ${(confidence / 100).toFixed(2)}\n}`}</code>
            </div>
            <p className="device-disclaimer">연구용 커넥터 프로토타입입니다. 실제 장비 연동에는 참여자 동의, 제조사 승인과 해당 장비의 SDK 또는 API가 필요합니다.</p>
          </div>
        </div>
      </section>

      <section className="action-section">
        <div className="action-number">06</div>
        <div className="action-content">
          <span>최적의 다음 행동</span>
          <h2>단 하나의 행동. 명확한 근거. 측정 가능한 후속관찰.</h2>
          <div className="action-card">
            <div className="action-badge">{confidence < 50 ? "측정 우선" : metrics.lowest.short}</div>
            <div className="action-main">
              <span>지금의 권고</span>
              <h3>{nextAction.action}</h3>
            </div>
            <div className="action-why"><span>이 행동을 고른 이유</span><p>{nextAction.reason}</p></div>
            <div className="action-measure"><span>관찰계획</span><p>{nextAction.metric}</p></div>
          </div>
          <p className="safety-note">연구용 가이드입니다. 본 엔진은 질병을 진단하거나 치료를 처방하거나 약물 용량을 결정하지 않습니다.</p>
        </div>
      </section>

      <section className="architecture-section" id="architecture">
        <div className="section-heading">
          <span>07 / 기술 아키텍처</span>
          <h2>추적 가능한 연구 파이프라인으로 설계했습니다.</h2>
          <p>각 계층은 검증에 필요한 출처·불확실성·버전 정보를 보존합니다.</p>
        </div>
        <div className="architecture-flow">
          {[
            ["01", "다중모달 패브릭", "임상·웨어러블·식사영상·약물맥락·유전·후성유전 신호를 통합합니다."],
            ["02", "비교 가능한 객체", "시간창 특징에 결측도·경과시간·출처·측정 불확실성을 보존합니다."],
            ["03", "개인 기준선", "집단 사전분포를 개인별 종단분포로 점진적으로 조정합니다."],
            ["04", "상태·GEIS 엔진", "잠재 회복동역학·지속성 규칙·균형 조정 점수를 분리해 산출합니다."],
            ["05", "인과적 가이드", "예상변화·안전성·부담·정보이득을 기준으로 후보 행동을 정렬합니다."],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
        <div className="architecture-principles">
          <div><span>데이터 계보</span><b>출처 인식</b><p>각 특징의 출처·시간창·전처리 버전을 보존합니다.</p></div>
          <div><span>불확실성</span><b>감추지 않음</b><p>데이터 신뢰도를 건강점수와 행동가치에서 분리해 보고합니다.</p></div>
          <div><span>인과성</span><b>검증 가능</b><p>권고를 단순 상관관계가 아닌 관찰 가능한 N-of-1 가설로 제시합니다.</p></div>
          <div><span>안전성</span><b>제약 적용</b><p>신뢰도가 낮거나 충돌이 해결되지 않으면 추가 측정을 우선합니다.</p></div>
        </div>
      </section>

      <section className="api-section" id="api">
        <div className="api-intro">
          <span>08 / 연구 API</span>
          <h2>현재 모델을 실제 연구 흐름으로 연결합니다.</h2>
          <p>아래 인터페이스는 페이지의 실시간 값을 반영하여 협력연구자가 엔진의 논리를 쉽게 검토하고 논의할 수 있게 합니다.</p>
          <div className="api-notes"><span>HTTPS 기반 JSON</span><span>모델 버전관리</span><span>대상자 가명처리</span></div>
        </div>
        <div className="api-console">
          <div className="api-tabs" role="tablist" aria-label="API 예시">
            {([
              ["ingest", "근거자료 입력"],
              ["calculate", "GEIS 계산"],
              ["simulate", "전환상태 시뮬레이션"],
              ["recommend", "행동 추천"],
              ["device", "장비 제어"],
            ] as Array<[EndpointKey, string]>).map(([key, label]) => (
              <button key={key} role="tab" aria-selected={endpoint === key} onClick={() => setEndpoint(key)}>{label}</button>
            ))}
          </div>
          <div className="api-path"><span>{activeApi.method}</span><code>{activeApi.path}</code><button onClick={copyApi}>{copied ? "복사됨" : "예시 복사"}</button></div>
          <pre aria-label="API 요청과 응답 예시"><code>{apiText}</code></pre>
        </div>
      </section>

      <section className="research-section">
        <div>
          <span>연구자와 협력기관을 위한 플랫폼</span>
          <h2>코호트·센서·중재연구를 GEIS와 연결하세요.</h2>
        </div>
        <p>
          GEIS는 대사건강·회복·행동중재·종단 디지털 바이오마커 연구에서 전향적으로
          검증할 수 있도록 설계되었습니다. 다음 단계는 보정·외부검증·하위집단 분석과
          실제 환경의 N-of-1 연구를 통한 근거 축적입니다.
        </p>
        <button onClick={exportSnapshot}>연구 스냅샷 내려받기 <span>↓</span></button>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">BQ</span><span>BODY Q <em>리서치</em></span></div>
        <p>Good Energy Intelligence Score · 연구 인터페이스</p>
        <p>© 2026 BODY Q. 연구용으로 제공됩니다.</p>
      </footer>
    </main>
  );
}
