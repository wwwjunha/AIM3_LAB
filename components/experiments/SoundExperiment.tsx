'use client';

import { Check, Music2, Volume2 } from 'lucide-react';
import { recordTrial } from '@/lib/inquiry';
import { useRef, useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';
import { playStringTone } from '@/lib/audio';

type StringId = 'short' | 'medium' | 'long';
const strings: { id: StringId; label: string; friend: string; sound: string; frequency: number }[] = [
  { id: 'short', label: '짧게', friend: '🐭', sound: '높은 소리', frequency: 520 },
  { id: 'medium', label: '보통', friend: '🐰', sound: '중간 소리', frequency: 390 },
  { id: 'long', label: '길게', friend: '🦒', sound: '낮은 소리', frequency: 260 },
];

export default function SoundExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [played, setPlayed] = useState<StringId[]>([]);
  const [active, setActive] = useState<StringId | null>(null);
  const [pull, setPull] = useState(0);
  const pointerY = useRef(0);

  function pluck(id: StringId, frequency: number) {
    const item = strings.find((item) => item.id === id);
    if (item) recordTrial('sound', `${item.label} 줄`, `${item.sound} · 합성음 ${frequency}Hz`);
    void playStringTone(frequency);
    setActive(id);
    setPull(0);
    setPlayed((old) => old.includes(id) ? old : [...old, id]);
    window.setTimeout(() => setActive((current) => current === id ? null : current), 820);
  }

  if (step === 4) return <ExperimentShell id="sound" title="소리 연구소" step={4} accent="sound-theme"><SuccessScreen id="sound" title="소리 연구소" report={{ title: '소리 연구소', question: '고무줄을 튕기면 줄은 어떻게 될까?', prediction, observations: ['길이가 다른 고무줄 세 개를 모두 튕겨 보았어요.', '고무줄이 떨리면서 소리가 났어요.', '줄의 조건에 따라 높고 낮은 소리가 달라졌어요.'], discovery: '소리가 나는 물체에는 떨림이 있고, 조건을 바꾸면 높고 낮은 소리를 만들 수 있어요.', skills: ['소리 비교하기', '떨림 관찰하기', '규칙 찾기'] }} onRetry={() => { setStep(0); setPlayed([]); }} /></ExperimentShell>;

  return (
    <ExperimentShell id="sound" title="소리 연구소" step={step} accent="sound-theme">
      {step === 0 && <section className="question-screen sound-question">
        <ScientistGuide>고무줄을 튕기면 무슨 일이 생길까?</ScientistGuide>
        <div className="guitar-preview" aria-hidden="true"><span>♪</span><div className="preview-string" /><span>♫</span></div>
        <h1>고무줄 기타를 연주해보자!</h1>
        <PrimaryButton tone="sound" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
      </section>}

      {step === 1 && <section className="prediction-screen">
        <ScientistGuide>먼저 어떻게 될지 예상해보자!</ScientistGuide>
        <h1>고무줄을 튕기면 줄은 어떻게 될까?</h1>
        <div className="choice-grid">
          {['떨릴 것 같아', '가만히 있을 것 같아'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
        </div>
        <PrimaryButton tone="sound" disabled={!prediction} onClick={() => setStep(2)}>직접 연주해보자!</PrimaryButton>
      </section>}

      {step === 2 && <section className="hands-on-screen sound-lab">
        <div className="stage-heading"><span><Music2 size={20} /> 누르거나 당겼다 놓아 봐!</span><h1>세 고무줄을 모두 연주해보자</h1></div>
        <div className="string-instrument">
          <div className="instrument-neck" aria-hidden="true" />
          {strings.map((item) => <button key={item.id} className={`string-row ${item.id} ${active === item.id ? 'is-playing' : ''}`} onPointerDown={(event) => { pointerY.current = event.clientY; setPull(0); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => setPull(Math.min(24, Math.abs(event.clientY - pointerY.current)))} onPointerUp={() => pluck(item.id, item.frequency)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pluck(item.id, item.frequency); } }} style={{ '--pull': `${active === item.id ? pull : 0}px` } as React.CSSProperties} aria-label={`${item.label} 고무줄, ${item.sound}`}>
            <span className="string-friend">{item.friend}</span><span className="string-label">{item.label}</span><span className="rubber-string" /><span className="sound-label">{played.includes(item.id) ? item.sound : '튕겨 보기'}</span>
            {active === item.id && <span className="floating-notes" aria-hidden="true">♪ ♫</span>}
          </button>)}
        </div>
        <div className="sound-note"><Volume2 size={21} /><span>소리를 켜지 않아도 줄의 떨림을 볼 수 있어!</span></div>
        <div className="trial-status"><span className={played.length === 3 ? 'done' : ''}>{played.length === 3 ? '✓' : `${played.length}/3`} 고무줄 연주</span></div>
        <PrimaryButton tone="sound" disabled={played.length < 3} onClick={() => setStep(3)}>소리 비교하기</PrimaryButton>
      </section>}

      {step === 3 && <section className="discovery-screen">
        <ScientistGuide>고무줄이 떨리면서 소리가 났어!</ScientistGuide>
        <h1>우리가 발견한 것</h1>
        <div className="sound-comparison">{strings.map((item) => <div key={item.id}><span>{item.friend}</span><strong>{item.label}</strong><p>🎵 {item.sound}</p></div>)}</div>
        <div className="big-discovery">소리가 나는 물체에서는 <strong>떨림</strong>을 볼 수 있어요.<br />조건이 달라지면 <strong>높고 낮은 소리</strong>를 만들 수 있어요.</div>
        {prediction !== '떨릴 것 같아' && <p className="prediction-note">예상과 달랐네! 직접 실험해서 알아냈어.</p>}
        <PrimaryButton tone="sound" onClick={() => setStep(4)}>별 받기</PrimaryButton>
      </section>}
    </ExperimentShell>
  );
}
