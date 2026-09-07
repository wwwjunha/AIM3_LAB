'use client';

import { Check, Clock3, ThermometerSun } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

export default function HeatExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [time, setTime] = useState(0);

  function retry() {
    setStep(0); setPrediction(''); setTime(0);
  }

  if (step === 4) return <ExperimentShell id="heat" title="온도 연구소" step={4} accent="heat-theme"><SuccessScreen id="heat" title="온도 연구소" onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="heat" title="온도 연구소" step={step} accent="heat-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>똑같은 얼음 두 개를 서로 다른 곳에 두면 어떨까?</ScientistGuide>
      <div className="lab-hero-object"><span>🧊</span><strong>☀️</strong><span>🧊</span><strong>❄️</strong></div>
      <h1>얼음은 어디에서 더 빨리 녹을까?</h1>
      <PrimaryButton tone="heat" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>따뜻한 곳과 서늘한 곳을 비교해 보자.</ScientistGuide>
      <h1>어느 쪽 얼음이 먼저 작아질까?</h1>
      <div className="choice-grid three">
        {['따뜻한 곳', '서늘한 곳', '둘 다 똑같아요'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="heat" disabled={!prediction} onClick={() => setStep(2)}>시간 보내기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><ThermometerSun size={20} /> 같은 시간 동안 두 얼음을 관찰해 봐!</span><h1>시간을 세 번 보내 보자</h1></div>
      <div className="ice-comparison">
        <div className="temperature-zone warm"><span>따뜻한 곳 28°C</span><div className="ice-cube" style={{ transform: `scale(${1 - time * .24})`, opacity: 1 - time * .2 }}>🧊</div><div className="puddle" style={{ width: `${35 + time * 20}%` }} /><strong>{time === 3 ? '거의 다 녹았어!' : '점점 작아져요'}</strong></div>
        <div className="temperature-zone cool"><span>서늘한 곳 15°C</span><div className="ice-cube" style={{ transform: `scale(${1 - time * .1})` }}>🧊</div><div className="puddle" style={{ width: `${25 + time * 9}%` }} /><strong>{time === 3 ? '아직 얼음이 남았어!' : '천천히 작아져요'}</strong></div>
      </div>
      <div className="time-dots" aria-label={`관찰 시간 ${time}단계`}><span className={time > 0 ? 'done' : ''}>1</span><span className={time > 1 ? 'done' : ''}>2</span><span className={time > 2 ? 'done' : ''}>3</span></div>
      <button className="action-control" disabled={time >= 3} onClick={() => setTime((old) => Math.min(3, old + 1))}><Clock3 size={20} /> {time >= 3 ? '관찰 완료' : '시간 보내기'}</button>
      <PrimaryButton tone="heat" disabled={time < 3} onClick={() => setStep(3)}>녹은 정도 비교하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>같은 시간이 지나도 따뜻한 곳의 얼음이 더 많이 녹았어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>☀️ 💧</span><strong>따뜻한 곳</strong><p>얼음이 빠르게 작아졌어.</p></div><div><span>❄️ 🧊</span><strong>서늘한 곳</strong><p>얼음이 더 많이 남았어.</p></div></div>
      <div className="big-discovery">주변 온도가 다르면 녹는 빠르기도 달라져요.<br /><strong>얼음은 더 따뜻한 곳에서 더 빨리 녹아요.</strong></div>
      {prediction !== '따뜻한 곳' && <p className="prediction-note">온도를 하나만 바꾸어 비교하니 차이가 보였어!</p>}
      <PrimaryButton tone="heat" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
