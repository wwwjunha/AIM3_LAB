'use client';

import { Check, MoveHorizontal, Sun } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

export default function LightExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [distance, setDistance] = useState(50);
  const [tested, setTested] = useState<string[]>([]);
  const position = distance < 40 ? 'near' : distance > 60 ? 'far' : 'middle';

  function observe(value: number) {
    setDistance(value);
    const zone = value < 40 ? 'near' : value > 60 ? 'far' : 'middle';
    setTested((old) => old.includes(zone) ? old : [...old, zone]);
  }

  function retry() {
    setStep(0); setPrediction(''); setDistance(50); setTested([]);
  }

  if (step === 4) return <ExperimentShell id="light" title="빛 연구소" step={4} accent="light-theme"><SuccessScreen id="light" title="빛 연구소" report={{ title: '빛 연구소', question: '손전등을 가까이 가져가면 그림자 크기는 어떻게 될까?', prediction, observations: ['손전등을 물체 가까이와 멀리 모두 움직여 보았어요.', '빛이 가까울 때 그림자가 커지고 멀 때 작아졌어요.'], discovery: '빛과 물체 사이의 거리에 따라 그림자 크기가 달라져요.', skills: ['거리 조절하기', '크기 비교하기', '관찰하기'] }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="light" title="빛 연구소" step={step} accent="light-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>손전등을 움직이면 그림자도 달라질까?</ScientistGuide>
      <div className="lab-hero-object"><span>🔦</span><strong>→</strong><span>🧸</span><strong>→</strong><span>⬛</span></div>
      <h1>그림자를 크게 만들 수 있을까?</h1>
      <PrimaryButton tone="light" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>손전등을 인형 가까이 가져가면 어떨까?</ScientistGuide>
      <h1>그림자 크기는 어떻게 될까?</h1>
      <div className="choice-grid three">
        {['더 커져요', '더 작아져요', '그대로예요'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="light" disabled={!prediction} onClick={() => setStep(2)}>빛 움직이기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><MoveHorizontal size={20} /> 손전등을 가까이, 멀리 움직여 봐!</span><h1>빛의 거리를 바꾸며 관찰하자</h1></div>
      <div className="shadow-lab">
        <div className="lamp" style={{ left: `${distance * .55}%` }}><Sun size={42} /><span>손전등</span></div>
        <div className="toy-shape">♟<span>인형</span></div>
        <div className="shadow-screen"><div className="cast-shadow" style={{ transform: `scale(${1.55 - distance * .009})` }} /><strong>{position === 'near' ? '큰 그림자' : position === 'far' ? '작은 그림자' : '중간 그림자'}</strong></div>
      </div>
      <label className="distance-control"><span>가까이</span><input type="range" min="15" max="85" value={distance} onChange={(event) => observe(Number(event.target.value))} aria-label="손전등 거리" /><span>멀리</span></label>
      <div className="quick-controls"><button onClick={() => observe(20)}>가까이 놓기</button><button onClick={() => observe(80)}>멀리 놓기</button></div>
      <PrimaryButton tone="light" disabled={!tested.includes('near') || !tested.includes('far')} onClick={() => setStep(3)}>그림자 비교하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>빛의 위치를 바꾸니 그림자 크기가 달라졌지?</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>🔦 🧸</span><strong>빛이 가까울 때</strong><p>그림자가 크게 보였어.</p></div><div><span>🔦　　🧸</span><strong>빛이 멀 때</strong><p>그림자가 작게 보였어.</p></div></div>
      <div className="big-discovery">빛과 물체 사이의 거리에 따라<br /><strong>그림자 크기가 달라져요.</strong></div>
      {prediction !== '더 커져요' && <p className="prediction-note">직접 움직여 보니 더 확실하게 알 수 있었어!</p>}
      <PrimaryButton tone="light" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
