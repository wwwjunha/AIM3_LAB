'use client';

import { Check, Clock3, Droplets } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

const colors = [{ name: '빨강', value: '#e74c4c' }, { name: '파랑', value: '#2787d8' }, { name: '보라', value: '#9b55ba' }];

export default function PlantExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [color, setColor] = useState(colors[1]);
  const [time, setTime] = useState(0);

  function retry() {
    setStep(0); setPrediction(''); setColor(colors[1]); setTime(0);
  }

  if (step === 4) return <ExperimentShell id="plant" title="식물 연구소" step={4} accent="plant-theme"><SuccessScreen id="plant" title="식물 연구소" report={{ title: '식물 연구소', question: '색깔 물은 식물의 어디로 갈까?', prediction, observations: [`${color.name}색 물에 꽃을 꽂고 시간에 따른 변화를 관찰했어요.`, '줄기를 따라 색깔 물이 올라가 꽃잎 가장자리에도 색이 보였어요.'], discovery: '식물의 줄기는 물을 위쪽 잎과 꽃까지 옮겨요.', skills: ['시간에 따른 변화 보기', '색 변화 관찰하기', '이동 경로 추리하기'] }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="plant" title="식물 연구소" step={step} accent="plant-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>흰 꽃을 색깔 물에 꽂아 두면 무슨 일이 생길까?</ScientistGuide>
      <div className="lab-hero-object"><span>🌼</span><strong>+</strong><span>🧪</span><strong>= ?</strong></div>
      <h1>색깔 물은 식물의 어디로 갈까?</h1>
      <PrimaryButton tone="plant" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>시간이 지나면 꽃잎을 자세히 살펴보자.</ScientistGuide>
      <h1>흰 꽃은 어떻게 될까?</h1>
      <div className="choice-grid three">
        {['꽃잎에 색이 보여요', '줄기만 색칠돼요', '아무 변화 없어요'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="plant" disabled={!prediction} onClick={() => setStep(2)}>꽃 관찰하기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><Droplets size={20} /> 물 색깔을 고르고 시간을 보내 봐!</span><h1>줄기를 따라 움직이는 물을 관찰하자</h1></div>
      <div className="plant-lab">
        <div className="flower" style={{ '--flower-color': color.value, '--color-strength': time / 3 } as React.CSSProperties}><span>🌼</span><div className="plant-stem" /></div>
        <div className="color-beaker" style={{ '--water-color': color.value } as React.CSSProperties}><span>{color.name} 물</span></div>
      </div>
      <div className="color-picker" aria-label="물 색깔 고르기">{colors.map((item) => <button className={color.name === item.name ? 'selected' : ''} style={{ backgroundColor: item.value }} onClick={() => { setColor(item); setTime(0); }} aria-label={`${item.name} 물`} key={item.name} />)}</div>
      <p className="observation-message">{time === 0 ? '아직 흰 꽃이야. 시간을 보내 볼까?' : time < 3 ? '줄기를 따라 색깔 물이 조금씩 올라가고 있어!' : `꽃잎 가장자리에 ${color.name}색이 보이기 시작했어!`}</p>
      <button className="action-control" disabled={time >= 3} onClick={() => setTime((old) => Math.min(3, old + 1))}><Clock3 size={20} /> {time >= 3 ? '관찰 완료' : '시간 보내기'}</button>
      <PrimaryButton tone="plant" disabled={time < 3} onClick={() => setStep(3)}>변화 확인하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>색깔 물이 줄기를 지나 꽃잎까지 올라왔어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>🥤</span><strong>처음에는</strong><p>컵에 색깔 물이 있었어.</p></div><div><span>🌸</span><strong>시간이 지나면</strong><p>줄기와 꽃잎에 색이 보였어.</p></div></div>
      <div className="big-discovery">식물이 물을 마시는 길을 색으로 확인했어.<br /><strong>줄기는 물을 위쪽 잎과 꽃까지 옮겨요.</strong></div>
      {prediction !== '꽃잎에 색이 보여요' && <p className="prediction-note">오래 관찰하니 예상하지 못한 변화가 보였어!</p>}
      <PrimaryButton tone="plant" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
