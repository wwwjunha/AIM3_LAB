'use client';

import { Check, Gauge, Hand, Scale, SlidersHorizontal, Target } from 'lucide-react';
import { recordTrial } from '@/lib/inquiry';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';
import { boxLabels, MAX_DISTANCE, travelDistance, type BoxMass, type ForceTrial } from '@/lib/forceModel';

const masses: BoxMass[] = ['light', 'heavy'];
const targets = [20, 35, 48];
const explanationChoices = [
  '같은 바닥에서 같은 힘으로 밀었을 때 가벼운 상자가 더 멀리 움직였어요.',
  '상자의 색깔이 밝아서 더 멀리 움직였어요.',
  '무거운 상자 안에는 바람이 들어 있기 때문이에요.',
];

function shellStep(phase: number) {
  if (phase === 0) return 0;
  if (phase === 1) return 1;
  if (phase <= 4) return 2;
  if (phase <= 6) return 3;
  return 4;
}

function DistanceTrack({ distance, target, mass }: { distance: number; target?: number; mass: BoxMass }) {
  return <div className="force-measure-track" aria-label={`${boxLabels[mass]} 이동 거리 ${distance}칸${target === undefined ? '' : `, 목표 ${target}칸`}`}>
    <div className="force-measure-line" aria-hidden="true" />
    {target !== undefined && <div className="force-measure-target" style={{ left: `${(target / MAX_DISTANCE) * 100}%` }}><Target size={19} /><span>목표</span></div>}
    <div className={`force-measure-box ${mass}`} style={{ left: `clamp(0px, calc(${(distance / MAX_DISTANCE) * 100}% - 24px), calc(100% - 50px))` }}>{mass === 'light' ? '가벼움' : '무거움'}</div>
    <output className="force-measure-reading">{distance}칸</output>
    <div className="force-measure-ticks" aria-hidden="true">{[0, 20, 40, 60, 80].map((tick) => <span key={tick}>{tick}</span>)}</div>
  </div>;
}

export default function ForceExperiment() {
  const [phase, setPhase] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [fairForce, setFairForce] = useState(55);
  const [fairTrials, setFairTrials] = useState<ForceTrial[]>([]);
  const [pendingTrial, setPendingTrial] = useState<ForceTrial | null>(null);
  const [recordedDistance, setRecordedDistance] = useState('');
  const [recordFeedback, setRecordFeedback] = useState('');
  const [comparisonMass, setComparisonMass] = useState<BoxMass>('light');
  const [comparisonForce, setComparisonForce] = useState(45);
  const [forceTrials, setForceTrials] = useState<ForceTrial[]>([]);
  const [forceFeedback, setForceFeedback] = useState('');
  const [challengeMass, setChallengeMass] = useState<BoxMass>('light');
  const [challengeForce, setChallengeForce] = useState(45);
  const [mission, setMission] = useState(0);
  const [challengeTrials, setChallengeTrials] = useState<Array<ForceTrial & { target: number; success: boolean }>>([]);
  const [challengeDistance, setChallengeDistance] = useState(0);
  const [challengeMessage, setChallengeMessage] = useState('상자와 힘을 골라 첫 번째 목표에 도전하세요.');
  const [explanation, setExplanation] = useState('');
  const [explanationFeedback, setExplanationFeedback] = useState('');

  const fairDone = masses.every((mass) => fairTrials.filter((trial) => trial.mass === mass).length === 2);
  const forceDone = forceTrials.length === 3;
  const target = targets[Math.min(mission, targets.length - 1)];
  const comparisonDistance = forceTrials.length ? forceTrials[forceTrials.length - 1].distance : 0;

  function pushFair(mass: BoxMass) {
    if (pendingTrial || fairTrials.filter((trial) => trial.mass === mass).length >= 2) return;
    setPendingTrial({ mass, force: fairForce, distance: travelDistance(mass, fairForce) });
    setRecordedDistance('');
    setRecordFeedback('눈금을 읽고 이동한 칸 수를 아래에 적어 주세요.');
  }

  function saveFairRecord() {
    if (!pendingTrial) return;
    if (Number(recordedDistance) !== pendingTrial.distance || recordedDistance.trim() === '') {
      setRecordFeedback('눈금에 표시된 숫자를 다시 확인해 보세요.');
      return;
    }
    if (pendingTrial) recordTrial('force', `${boxLabels[pendingTrial.mass]} · 힘 ${pendingTrial.force}`, `${pendingTrial.distance}칸 이동`);
    setFairTrials((old) => [...old, pendingTrial]);
    setPendingTrial(null);
    setRecordedDistance('');
    setRecordFeedback('기록 완료! 다음 실험을 해 보세요.');
  }

  function pushWithDifferentForce() {
    if (forceDone) return;
    if (forceTrials.some((trial) => Math.abs(trial.force - comparisonForce) < 10)) {
      setForceFeedback('이미 사용한 힘과 10 이상 차이나게 조절해 보세요.');
      return;
    }
    const trial = { mass: comparisonMass, force: comparisonForce, distance: travelDistance(comparisonMass, comparisonForce) };
    recordTrial('force', `${boxLabels[comparisonMass]} · 힘 ${comparisonForce}`, `${travelDistance(comparisonMass, comparisonForce)}칸 이동`);
    setForceTrials((old) => [...old, trial]);
    setForceFeedback(`${comparisonForce}의 힘으로 밀자 ${trial.distance}칸 움직였어요.`);
  }

  function launchChallenge() {
    if (mission >= targets.length) return;
    const distance = travelDistance(challengeMass, challengeForce);
    const success = Math.abs(distance - target) <= 3;
    recordTrial('force', `목표 ${target}칸 · ${boxLabels[challengeMass]} · 힘 ${challengeForce}`, `${distance}칸 이동 · ${success ? '목표 도착' : '다시 조절'}`);
    setChallengeTrials((old) => [...old, { mass: challengeMass, force: challengeForce, distance, target, success }]);
    setChallengeDistance(distance);
    if (success) {
      const nextMission = mission + 1;
      setMission(nextMission);
      if (nextMission < targets.length) setChallengeDistance(0);
      setChallengeMessage(nextMission === targets.length
        ? `성공! ${distance}칸 이동했어요. 세 목표를 모두 맞혔어요.`
        : `${distance}칸 이동해 성공! 다음 목표의 거리를 보고 조건을 바꿔 보세요.`);
      return;
    }
    setChallengeMessage(distance < target
      ? `${distance}칸 이동했어요. 목표 ${target}칸까지 더 가려면 힘이나 상자 무게를 바꿔 보세요.`
      : `${distance}칸 이동했어요. 목표 ${target}칸을 지나쳤어요. 힘이나 상자 무게를 바꿔 보세요.`);
  }

  function checkExplanation(choice: string) {
    setExplanation(choice);
    setExplanationFeedback(choice === explanationChoices[0]
      ? '맞아요! 직접 기록한 거리로 설명했어요.'
      : '상자의 색깔과 바람 대신, 같은 힘으로 밀었던 두 상자의 기록을 다시 떠올려 보세요.');
  }

  function retry() {
    setPhase(0);
    setPrediction('');
    setFairForce(55);
    setFairTrials([]);
    setPendingTrial(null);
    setRecordedDistance('');
    setRecordFeedback('');
    setComparisonMass('light');
    setComparisonForce(45);
    setForceTrials([]);
    setForceFeedback('');
    setChallengeMass('light');
    setChallengeForce(45);
    setMission(0);
    setChallengeTrials([]);
    setChallengeDistance(0);
    setChallengeMessage('상자와 힘을 골라 첫 번째 목표에 도전하세요.');
    setExplanation('');
    setExplanationFeedback('');
  }

  if (phase === 7) {
    const fairSummary = fairTrials.map((trial) => `${boxLabels[trial.mass]} ${trial.force}의 힘 → ${trial.distance}칸`).join(' / ');
    const forceSummary = forceTrials.map((trial) => `${trial.force}의 힘 → ${trial.distance}칸`).join(' / ');
    return <ExperimentShell id="force" title="힘 연구소" step={4} accent="force-theme">
      <SuccessScreen id="force" title="힘 연구소" report={{
        title: '힘 연구소',
        question: '상자의 무게와 미는 힘을 바꾸면 이동 거리는 어떻게 달라질까?',
        prediction,
        observations: [
          `같은 바닥에서 같은 힘으로 각각 두 번 밀고 거리를 기록했어요: ${fairSummary}.`,
          `같은 ${boxLabels[comparisonMass]}에 다른 힘을 주었어요: ${forceSummary}.`,
          `목표 지점 세 곳에 도전해 ${challengeTrials.length}번 밀었고, ${challengeTrials.filter((trial) => trial.success).length}개 목표에 도착했어요.`,
          `실험 결과를 보고 "${explanation}"라고 설명했어요.`,
        ],
        discovery: '이 화면의 같은 바닥과 밀기 시간 조건에서는 상자의 무게와 미는 힘에 따라 이동 거리가 달라졌어요.',
        skills: ['조건 통제하기', '거리 측정·기록하기', '힘 조절하기', '결과 설명하기'],
      }} onRetry={retry} />
    </ExperimentShell>;
  }

  return <ExperimentShell id="force" title="힘 연구소" step={shellStep(phase)} accent="force-theme">
    <div className="force-activity-progress" aria-label={`힘 탐구 활동 ${Math.min(phase + 1, 6)}단계 중 6단계`}>
      <span>힘 탐구</span><div><i style={{ width: `${Math.min(100, ((phase + 1) / 6) * 100)}%` }} /></div><strong>{Math.min(phase + 1, 6)} / 6</strong>
    </div>

    {phase === 0 && <section className="question-screen">
      <ScientistGuide>오늘은 상자의 무게와 미는 힘을 하나씩 바꾸며 비교할 거야.</ScientistGuide>
      <div className="question-objects"><div className="mystery-box">가벼움</div><div className="versus">?</div><div className="mystery-box">무거움</div></div>
      <h1>무게와 힘이 달라지면<br />움직이는 거리도 달라질까?</h1>
      <p className="force-intro-note"><Scale size={21} /> 같은 바닥에서 관찰하는 화면 속 모형 실험이에요.</p>
      <PrimaryButton tone="force" onClick={() => setPhase(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {phase === 1 && <section className="prediction-screen">
      <ScientistGuide>같은 힘으로 밀 때 어떤 상자가 더 멀리 갈지 예상해 보자!</ScientistGuide>
      <h1>같은 힘으로 밀면?</h1>
      <div className="choice-grid three">
        {['가벼운 상자가 더 멀리', '무거운 상자가 더 멀리', '둘 다 같은 거리'].map((choice) =>
          <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="force" disabled={!prediction} onClick={() => setPhase(2)}>같은 힘으로 비교하기</PrimaryButton>
    </section>}

    {phase === 2 && <section className="hands-on-screen force-expanded-screen">
      <div className="stage-heading"><span><Hand size={20} /> 공정한 비교</span><h1>같은 힘으로 두 상자를 두 번씩 밀어 보자</h1></div>
      <p className="force-instruction">두 상자에 같은 힘을 주세요. 한 번 밀 때마다 눈금에 나타난 거리를 직접 기록하세요.</p>
      <label className="force-slider-label" htmlFor="fair-force"><span>함께 사용할 힘 {fairTrials.length > 0 && '(고정)'}</span><strong>{fairForce}</strong></label>
      <input id="fair-force" className="force-slider" type="range" min="20" max="90" step="1" value={fairForce} disabled={fairTrials.length > 0 || pendingTrial !== null} onChange={(event) => setFairForce(Number(event.target.value))} />
      <div className="force-tracks">
        {masses.map((mass) => <div className="force-row force-measure-row" key={mass}>
          <div className="track-label"><strong>{boxLabels[mass]}</strong><span>{fairTrials.filter((trial) => trial.mass === mass).length} / 2회 기록</span></div>
          <DistanceTrack mass={mass} distance={pendingTrial?.mass === mass ? pendingTrial.distance : fairTrials.filter((trial) => trial.mass === mass).at(-1)?.distance ?? 0} />
          <button className="push-alternative" disabled={pendingTrial !== null || fairTrials.filter((trial) => trial.mass === mass).length >= 2} onClick={() => pushFair(mass)}><Hand size={18} /> 밀기</button>
        </div>)}
      </div>
      {pendingTrial && <div className="force-record-panel">
        <strong>{boxLabels[pendingTrial.mass]}의 거리 기록</strong>
        <label htmlFor="distance-record">눈금에서 읽은 거리 (칸)</label>
        <div><input id="distance-record" type="number" min="0" max="80" inputMode="numeric" value={recordedDistance} onChange={(event) => setRecordedDistance(event.target.value)} /><button onClick={saveFairRecord}>관찰 기록하기</button></div>
      </div>}
      {recordFeedback && <p className="force-inline-feedback" aria-live="polite">{recordFeedback}</p>}
      {fairDone && <p className="force-observation">같은 힘 {fairForce}으로 밀자 가벼운 상자는 {travelDistance('light', fairForce)}칸, 무거운 상자는 {travelDistance('heavy', fairForce)}칸 움직였어요.</p>}
      <PrimaryButton tone="force" disabled={!fairDone} onClick={() => setPhase(3)}>이번에는 힘을 바꿔보기</PrimaryButton>
    </section>}

    {phase === 3 && <section className="hands-on-screen force-expanded-screen">
      <div className="stage-heading"><span><SlidersHorizontal size={20} /> 조건 바꾸기</span><h1>같은 상자를 서로 다른 힘으로 밀어 보자</h1></div>
      <p className="force-instruction">상자 한 개를 골라 그대로 사용해요. 힘을 10 이상씩 다르게 해서 세 번 시험하세요.</p>
      <fieldset className="force-mass-picker" aria-label="비교할 상자">{masses.map((mass) => <button key={mass} aria-pressed={comparisonMass === mass} disabled={forceTrials.length > 0} onClick={() => setComparisonMass(mass)}>{boxLabels[mass]}</button>)}</fieldset>
      <label className="force-slider-label" htmlFor="comparison-force"><span>미는 힘</span><strong>{comparisonForce}</strong></label>
      <input id="comparison-force" className="force-slider" type="range" min="20" max="90" value={comparisonForce} onChange={(event) => setComparisonForce(Number(event.target.value))} disabled={forceDone} />
      <DistanceTrack mass={comparisonMass} distance={comparisonDistance} />
      <button className="launch-button" disabled={forceDone} onClick={pushWithDifferentForce}><Hand size={21} /> 이 힘으로 밀기</button>
      {forceFeedback && <p className="force-inline-feedback" aria-live="polite">{forceFeedback}</p>}
      <div className="force-trial-table" aria-label="힘과 이동 거리 기록">
        <div><strong>미는 힘</strong><strong>이동 거리</strong></div>
        {[...forceTrials].sort((a, b) => a.force - b.force).map((trial) => <div key={trial.force}><span>{trial.force}</span><span>{trial.distance}칸</span></div>)}
      </div>
      <p className="force-instruction">{forceTrials.length} / 3회 기록 · 상자와 바닥은 같게, 힘만 다르게</p>
      <PrimaryButton tone="force" disabled={!forceDone} onClick={() => setPhase(4)}>힘 조절 미션 도전</PrimaryButton>
    </section>}

    {phase === 4 && <section className="hands-on-screen force-expanded-screen">
      <div className="stage-heading"><span><Target size={20} /> 힘 조절 미션</span><h1>상자를 목표 눈금에 보내 보자</h1></div>
      <div className="mission-status"><strong>{Math.min(mission + 1, 3)}번째 목표: {target}칸</strong><span>{mission} / 3 성공</span></div>
      <fieldset className="force-mass-picker" aria-label="도전할 상자">{masses.map((mass) => <button key={mass} aria-pressed={challengeMass === mass} disabled={mission >= 3} onClick={() => { setChallengeMass(mass); setChallengeDistance(0); }}>{boxLabels[mass]}</button>)}</fieldset>
      <DistanceTrack mass={challengeMass} distance={challengeDistance} target={target} />
      <label className="force-slider-label" htmlFor="challenge-force"><span>미는 힘</span><strong>{challengeForce}</strong></label>
      <input id="challenge-force" className="force-slider" type="range" min="20" max="90" value={challengeForce} onChange={(event) => setChallengeForce(Number(event.target.value))} disabled={mission >= 3} />
      <div className="slider-scale"><span>약하게</span><span>세게</span></div>
      <button className="launch-button" onClick={launchChallenge} disabled={mission >= 3}><Hand size={21} /> 이 조건으로 밀기</button>
      <p className={mission >= 3 ? 'challenge-feedback success' : 'challenge-feedback'} aria-live="polite">{challengeMessage}</p>
      <p className="force-instruction">{challengeTrials.length}번 시도했어요. 목표와의 차이가 3칸 이내면 성공!</p>
      <PrimaryButton tone="force" disabled={mission < 3} onClick={() => setPhase(5)}>결과를 설명해보기</PrimaryButton>
    </section>}

    {phase === 5 && <section className="prediction-screen force-explanation-screen">
      <ScientistGuide>직접 기록한 숫자를 보고 결과를 설명해 보자.</ScientistGuide>
      <h1>같은 힘으로 밀었을 때 무엇을 관찰했나요?</h1>
      <div className="explanation-choices">{explanationChoices.map((choice, index) => <button className={explanation === choice ? (index === 0 ? 'correct' : 'wrong') : ''} onClick={() => checkExplanation(choice)} key={choice}><span>{index + 1}</span>{choice}</button>)}</div>
      {explanationFeedback && <p className={explanation === explanationChoices[0] ? 'explanation-feedback correct' : 'explanation-feedback'} aria-live="polite">{explanationFeedback}</p>}
      <PrimaryButton tone="force" disabled={explanation !== explanationChoices[0]} onClick={() => setPhase(6)}>발견 정리하기</PrimaryButton>
    </section>}

    {phase === 6 && <section className="discovery-screen force-discovery-screen">
      <ScientistGuide>직접 바꾼 조건과 기록한 거리를 함께 살펴보자.</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="force-discovery-grid">
        <div><Scale size={30} /><strong>무게 비교</strong><p>같은 힘 {fairForce}: 가벼운 상자 {travelDistance('light', fairForce)}칸, 무거운 상자 {travelDistance('heavy', fairForce)}칸</p></div>
        <div><Gauge size={30} /><strong>힘 비교</strong><p>같은 {boxLabels[comparisonMass]}에 다른 힘을 주자 이동 거리가 달라졌어요.</p></div>
        <div><Target size={30} /><strong>힘 조절</strong><p>{challengeTrials.length}번 시도해 목표 세 곳에 도착했어요.</p></div>
      </div>
      <div className="big-discovery">같은 바닥에서는 <strong>상자의 무게와 미는 힘</strong>에 따라 이동 거리가 달라졌어요.</div>
      <p className="prediction-note">처음 예상: {prediction} · 실제 거리 기록으로 확인 완료!</p>
      <PrimaryButton tone="force" onClick={() => setPhase(7)}>별과 리포트 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
