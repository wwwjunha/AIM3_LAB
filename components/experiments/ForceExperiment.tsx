'use client';

import { Check, Gauge, Hand } from 'lucide-react';
import { useRef, useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

type BoxId = 'light' | 'heavy';

export default function ForceExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [travel, setTravel] = useState<Record<BoxId, number>>({ light: 0, heavy: 0 });
  const [tested, setTested] = useState<BoxId[]>([]);
  const dragStart = useRef<{ id: BoxId; x: number; base: number } | null>(null);

  function push(id: BoxId, input = 70) {
    const resistance = id === 'light' ? 1 : 2.25;
    setTravel((old) => ({ ...old, [id]: Math.min(100, old[id] + input / resistance) }));
    setTested((old) => old.includes(id) ? old : [...old, id]);
  }

  function pointerDown(id: BoxId, event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { id, x: event.clientX, base: travel[id] };
  }

  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current) return;
    const { id, x, base } = dragStart.current;
    const resistance = id === 'light' ? 1.15 : 2.55;
    setTravel((old) => ({ ...old, [id]: Math.max(base, Math.min(100, base + Math.max(0, event.clientX - x) / resistance)) }));
  }

  function pointerUp() {
    if (dragStart.current) setTested((old) => old.includes(dragStart.current!.id) ? old : [...old, dragStart.current!.id]);
    dragStart.current = null;
  }

  if (step === 4) return <ExperimentShell id="force" title="힘 연구소" step={4} accent="force-theme"><SuccessScreen id="force" title="힘 연구소" onRetry={() => { setStep(0); setTravel({ light: 0, heavy: 0 }); setTested([]); }} /></ExperimentShell>;

  return (
    <ExperimentShell id="force" title="힘 연구소" step={step} accent="force-theme">
      {step === 0 && <section className="question-screen">
        <ScientistGuide>두 상자를 밀면 느낌이 똑같을까?</ScientistGuide>
        <div className="question-objects"><div className="mystery-box"><span>A</span></div><div className="versus">?</div><div className="mystery-box"><span>B</span></div></div>
        <h1>어떤 상자를 밀기 더 쉬울까?</h1>
        <PrimaryButton tone="force" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
      </section>}

      {step === 1 && <section className="prediction-screen">
        <ScientistGuide>먼저 어떻게 될지 예상해보자!</ScientistGuide>
        <h1>어떤 상자가 밀기 더 쉬울까?</h1>
        <div className="choice-grid three">
          {['가벼운 상자', '무거운 상자', '둘 다 똑같을 것 같아'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
        </div>
        <PrimaryButton tone="force" disabled={!prediction} onClick={() => setStep(2)}>직접 밀어보자!</PrimaryButton>
      </section>}

      {step === 2 && <section className="hands-on-screen">
        <div className="stage-heading"><span><Hand size={20} /> 상자를 오른쪽으로 밀어 봐!</span><h1>두 상자를 모두 움직여 보자</h1></div>
        <div className="force-tracks">
          {(['light', 'heavy'] as BoxId[]).map((id) => {
            const done = tested.includes(id);
            return <div className="force-row" key={id}>
              <div className="track-label"><strong>{id === 'light' ? '가벼운 상자' : '무거운 상자'}</strong><span>{done ? (id === 'light' ? '조금만 밀어도 움직였어!' : '더 힘껏 밀어야 움직였어!') : '아직 안 밀어봤어'}</span></div>
              <div className="force-track">
                <div className="track-dashes" />
                <button className={`push-box ${id}`} style={{ left: `calc(${Math.min(travel[id], 82)}% - 28px)` }} onPointerDown={(event) => pointerDown(id, event)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label={`${id === 'light' ? '가벼운' : '무거운'} 상자를 오른쪽으로 드래그`}><span>{id === 'light' ? '가벼워' : '무거워'}</span></button>
                <div className="finish-flag">도착</div>
              </div>
              <button className="push-alternative" onClick={() => push(id)}><Hand size={20} /> 밀기</button>
            </div>;
          })}
        </div>
        <div className="force-meter"><Gauge size={22} /><span>힘 느낌</span><div>🐭 조금</div><div>🐰 더</div><div>🦁 많이</div></div>
        <PrimaryButton tone="force" disabled={tested.length < 2} onClick={() => setStep(3)}>결과 비교하기</PrimaryButton>
      </section>}

      {step === 3 && <section className="discovery-screen">
        <ScientistGuide>같이 밀어보니까 느낌이 달랐지?</ScientistGuide>
        <h1>우리가 발견한 것</h1>
        <div className="compare-panels"><div><span>📦</span><strong>가벼운 상자</strong><p>조금만 밀어도 움직였어!</p></div><div><span>📦</span><strong>무거운 상자</strong><p>더 힘껏 밀어야 움직였어!</p></div></div>
        <div className="big-discovery">무거운 물체를 밀 때는<br /><strong>더 큰 힘이 필요할 수 있어요.</strong></div>
        {prediction !== '가벼운 상자' && <p className="prediction-note">예상과 달랐네! 직접 실험해서 알아냈어.</p>}
        <PrimaryButton tone="force" onClick={() => setStep(4)}>별 받기</PrimaryButton>
      </section>}
    </ExperimentShell>
  );
}
