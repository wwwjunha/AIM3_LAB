'use client';

import { Check, CloudRain, Mountain } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

type Slope = 'gentle' | 'steep';

export default function EarthExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<Slope[]>([]);

  function rain(slope: Slope) {
    setTested((old) => old.includes(slope) ? old : [...old, slope]);
  }

  function retry() {
    setStep(0); setPrediction(''); setTested([]);
  }

  if (step === 4) return <ExperimentShell id="earth" title="땅 연구소" step={4} accent="earth-theme"><SuccessScreen id="earth" title="땅 연구소" report={{ title: '땅 연구소', question: '어느 비탈에서 흙이 더 많이 움직일까?', prediction, observations: ['완만한 비탈과 가파른 비탈에 같은 양의 비를 내렸어요.', '가파른 비탈의 흙이 아래로 더 많이 움직였어요.'], discovery: '흐르는 물은 흙을 옮겨 땅의 모습을 바꾸고, 가파른 곳에서는 흙이 더 많이 움직일 수 있어요.', skills: ['공정하게 비교하기', '이동 거리 비교하기', '원인과 결과 찾기'] }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="earth" title="땅 연구소" step={step} accent="earth-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>비가 내리면 산비탈의 흙은 그대로 있을까?</ScientistGuide>
      <div className="lab-hero-object"><span>🌧️</span><strong>→</strong><span>⛰️</span><strong>→ ?</strong></div>
      <h1>빗물은 땅의 모습을 바꿀까?</h1>
      <PrimaryButton tone="earth" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>같은 양의 비를 두 비탈에 내린다고 생각해 봐.</ScientistGuide>
      <h1>어느 비탈에서 흙이 더 많이 움직일까?</h1>
      <div className="choice-grid three">
        {['가파른 비탈', '완만한 비탈', '둘 다 똑같아요'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="earth" disabled={!prediction} onClick={() => setStep(2)}>비 내려보기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><CloudRain size={20} /> 두 비탈에 같은 양의 비를 내려 봐!</span><h1>흙이 움직인 거리를 비교하자</h1></div>
      <div className="slope-grid">
        {(['gentle', 'steep'] as Slope[]).map((slope) => {
          const done = tested.includes(slope);
          return <div className={`slope-card ${slope} ${done ? 'rained' : ''}`} key={slope}>
            <strong>{slope === 'gentle' ? '완만한 비탈' : '가파른 비탈'}</strong>
            <div className="rain-cloud">☁️<span>💧 💧 💧</span></div>
            <div className="soil-slope"><span>● ● ●</span></div>
            <p>{done ? (slope === 'gentle' ? '흙이 조금 움직였어.' : '흙이 아래로 많이 움직였어!') : '아직 비가 오지 않았어.'}</p>
            <button onClick={() => rain(slope)}><CloudRain size={19} /> 같은 양의 비 내리기</button>
          </div>;
        })}
      </div>
      <div className="trial-status"><Mountain size={20} /><span className={tested.length === 2 ? 'done' : ''}>{tested.length} / 2 비탈 관찰 완료</span></div>
      <PrimaryButton tone="earth" disabled={tested.length < 2} onClick={() => setStep(3)}>흙 이동 비교하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>물이 흐르면서 흙 알갱이를 아래로 옮겼어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>🌦️ 〰️</span><strong>완만한 비탈</strong><p>흙이 조금 움직였어.</p></div><div><span>🌧️ ⛰️</span><strong>가파른 비탈</strong><p>흙이 더 멀리 움직였어.</p></div></div>
      <div className="big-discovery">흐르는 물은 흙을 옮겨 땅의 모습을 바꾸고,<br /><strong>가파른 곳에서는 흙이 더 많이 움직일 수 있어요.</strong></div>
      {prediction !== '가파른 비탈' && <p className="prediction-note">같은 양의 비라도 땅의 기울기에 따라 결과가 달랐어!</p>}
      <PrimaryButton tone="earth" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
