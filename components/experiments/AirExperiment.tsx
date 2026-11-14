'use client';

import { Check, RotateCw, Waves } from 'lucide-react';
import { recordTrial } from '@/lib/inquiry';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

export default function AirExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [cup, setCup] = useState<'ready' | 'upright' | 'tilted'>('ready');
  const [tested, setTested] = useState<string[]>([]);

  function tryCup(next: 'upright' | 'tilted') {
    recordTrial('air', next === 'upright' ? '컵을 똑바로 넣기' : '컵 기울이기', next === 'upright' ? '휴지가 마른 채로 있어요.' : '공기 방울이 나오고 물이 들어가요.');
    setCup(next);
    setTested((old) => old.includes(next) ? old : [...old, next]);
  }

  function retry() {
    setStep(0); setPrediction(''); setCup('ready'); setTested([]);
  }

  if (step === 4) return <ExperimentShell id="air" title="공기 연구소" step={4} accent="air-theme"><SuccessScreen id="air" title="공기 연구소" report={{ title: '공기 연구소', question: '컵 속 휴지는 물에 젖을까?', prediction, observations: ['컵을 똑바로 물에 넣었을 때 휴지가 마른 채로 있었어요.', '컵을 기울이자 공기 방울이 나오고 물이 컵 안으로 들어갔어요.'], discovery: '눈에 잘 보이지 않는 공기도 자리를 차지해요.', skills: ['조건 바꾸기', '변화 관찰하기', '까닭 설명하기'] }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="air" title="공기 연구소" step={step} accent="air-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>빈 컵은 정말 아무것도 없는 걸까?</ScientistGuide>
      <div className="lab-hero-object"><span>🥛</span><strong>+</strong><span>🧻</span><strong>+</strong><span>💧</span></div>
      <h1>컵 속 휴지는 물에 젖을까?</h1>
      <PrimaryButton tone="air" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>컵을 똑바로 뒤집어 물속에 넣는다고 생각해 봐.</ScientistGuide>
      <h1>컵 속 휴지는 어떻게 될까?</h1>
      <div className="choice-grid">
        {['마른 채로 있어요', '물에 젖어요'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="air" disabled={!prediction} onClick={() => setStep(2)}>물속에 넣어보기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><Waves size={20} /> 컵을 똑바로 넣은 뒤 기울여 봐!</span><h1>컵 속 공기를 찾아보자</h1></div>
      <div className={`air-tank ${cup}`}>
        <div className="water-line" />
        <div className="air-cup"><span className="tissue">휴지</span></div>
        {cup === 'tilted' && <div className="bubbles" aria-label="공기 방울">○ ◯ ○</div>}
      </div>
      <p className="observation-message">{cup === 'ready' ? '먼저 컵을 똑바로 넣어 봐.' : cup === 'upright' ? '컵 속 공기가 물을 막아서 휴지가 말라 있어!' : '컵을 기울이니 공기 방울이 나오고 물이 들어갔어!'}</p>
      <div className="quick-controls"><button onClick={() => tryCup('upright')}>↓ 똑바로 넣기</button><button onClick={() => tryCup('tilted')}><RotateCw size={18} /> 컵 기울이기</button></div>
      <PrimaryButton tone="air" disabled={!tested.includes('upright') || !tested.includes('tilted')} onClick={() => setStep(3)}>결과 비교하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>공기는 눈에 잘 안 보여도 컵 속에 있었어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>🥛</span><strong>컵을 똑바로 넣으면</strong><p>공기가 물을 막아 휴지가 말라 있었어.</p></div><div><span>🫧</span><strong>컵을 기울이면</strong><p>공기가 방울로 나오고 물이 들어갔어.</p></div></div>
      <div className="big-discovery">눈에 잘 보이지 않아도<br /><strong>공기도 자리를 차지해요.</strong></div>
      {prediction !== '마른 채로 있어요' && <p className="prediction-note">놀라운 결과지? 컵 속에는 공기가 있었어!</p>}
      <PrimaryButton tone="air" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
