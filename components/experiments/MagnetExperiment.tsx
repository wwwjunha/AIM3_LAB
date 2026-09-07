'use client';

import { Check, Magnet, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

const objects = [
  { id: 'clip', name: '철 클립', icon: '📎', sticks: true },
  { id: 'screw', name: '철 나사', icon: '🔩', sticks: true },
  { id: 'block', name: '나무 블록', icon: '🪵', sticks: false },
  { id: 'spoon', name: '플라스틱 숟가락', icon: '🥄', sticks: false },
] as const;

export default function MagnetExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<string[]>([]);

  function test(id: string) {
    setTested((old) => old.includes(id) ? old : [...old, id]);
  }

  function retry() {
    setStep(0);
    setPrediction('');
    setTested([]);
  }

  if (step === 4) return <ExperimentShell id="magnet" title="자석 연구소" step={4} accent="magnet-theme"><SuccessScreen id="magnet" title="자석 연구소" onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="magnet" title="자석 연구소" step={step} accent="magnet-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>자석은 모든 물체를 끌어당길까?</ScientistGuide>
      <div className="lab-hero-object"><span>🧲</span><strong>?</strong><span>📎</span><span>🪵</span></div>
      <h1>어떤 물체가 자석에 붙을까?</h1>
      <PrimaryButton tone="magnet" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>자석에 붙을 것 같은 물체를 골라 봐!</ScientistGuide>
      <h1>어떤 물체가 붙을까?</h1>
      <div className="choice-grid three">
        {['철로 된 물체', '나무로 된 물체', '모든 물체'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="magnet" disabled={!prediction} onClick={() => setStep(2)}>자석으로 확인하기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><MousePointerClick size={20} /> 자석으로 물체를 하나씩 건드려 봐!</span><h1>네 가지 물체를 모두 시험해 보자</h1></div>
      <div className="magnet-board">
        <div className="big-magnet"><Magnet size={58} /><strong>자석</strong></div>
        <div className="magnet-objects">
          {objects.map((item) => {
            const done = tested.includes(item.id);
            return <button className={`${done ? 'tested' : ''} ${done && item.sticks ? 'sticks' : ''}`} onClick={() => test(item.id)} key={item.id}>
              <span>{item.icon}</span><strong>{item.name}</strong><small>{done ? (item.sticks ? '찰칵! 붙었어' : '붙지 않았어') : '시험하기'}</small>
            </button>;
          })}
        </div>
      </div>
      <div className="trial-status"><span className={tested.length === objects.length ? 'done' : ''}>{tested.length} / {objects.length} 관찰 완료</span></div>
      <PrimaryButton tone="magnet" disabled={tested.length < objects.length} onClick={() => setStep(3)}>결과 모아보기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>재료에 따라 자석에 붙는지 달랐어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>📎 🔩</span><strong>철 클립과 철 나사</strong><p>자석에 붙었어!</p></div><div><span>🪵 🥄</span><strong>나무와 플라스틱</strong><p>자석에 붙지 않았어.</p></div></div>
      <div className="big-discovery">자석은 모든 물체가 아니라<br /><strong>철로 된 물체를 끌어당길 수 있어요.</strong></div>
      {prediction !== '철로 된 물체' && <p className="prediction-note">예상과 달라도 괜찮아. 실험으로 알아냈으니까!</p>}
      <PrimaryButton tone="magnet" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
