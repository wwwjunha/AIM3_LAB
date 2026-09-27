'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Glasses, Hand, RotateCcw, Star, FileText, Play, Home, Waves, Thermometer, Beaker, Droplets, Bubbles, FlaskConical, Sprout, Flower2, Palette, Package, Shapes, CloudRain } from 'lucide-react';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';
import { wetLabs, type WetLabKind } from './wetLabConfig';
import { createWetScene, type WetScene } from './wetLabScene';
import { playVrSound } from '@/lib/vrAudio';
import VrSoundButton from './VrSoundButton';

export default function WetVRLab({ kind }: { kind: WetLabKind }) {
  const config = wetLabs[kind];
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<WetScene | null>(null);
  const [phase, setPhase] = useState<'predict' | 'experiment' | 'complete'>('predict');
  const [prediction, setPrediction] = useState('');
  const predictionRef = useRef('');
  const [observed, setObserved] = useState<number[]>([]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [message, setMessage] = useState(config.instruction);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [supported, setSupported] = useState(false);
  const [inVr, setInVr] = useState(false);
  const [entering, setEntering] = useState(false);
  const [stars, setStars] = useState(0);
  const [round, setRound] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [busy, setBusy] = useState(false);
  const Icon = { air: Waves, heat: Thermometer, dissolve: Beaker, absorb: Droplets, surface: Bubbles, reaction: FlaskConical, seed: Sprout, plant: Flower2, color: Palette, force: Package, matter: Shapes, earth: CloudRain }[kind];

  useEffect(() => {
    if (!mount.current) return;
    let alive = true;
    try { startExperiment(kind); setStars(getProgress().totalStars); } catch { setSaveError(true); }
    let scene: WetScene | undefined;
    try {
      scene = createWetScene(mount.current, kind, {
        message: setMessage, placed: setPlaced, observed: setObserved,
        ready: () => setReady(true), vr: setInVr, error: setError, busy: setBusy,
        complete: () => {
          setPhase('complete');
          try {
            completeExperiment(kind, {
              title: `${config.title} VR`, question: config.question, prediction: predictionRef.current,
              observations: config.trials.map((trial) => trial.result), discovery: config.discovery,
              skills: ['3D 도구 직접 옮기기', '조건을 맞춰 비교하기', '변화 관찰하기'],
            });
            setStars(getProgress().totalStars);
          } catch { setSaveError(true); }
        },
      });
      engine.current = scene;
    } catch { setError('3D 화면을 열지 못했어요. 새로고침하거나 다른 브라우저에서 다시 시도해 주세요.'); }
    navigator.xr?.isSessionSupported('immersive-vr').then((value) => { if (alive) setSupported(value); }).catch(() => {});
    return () => { alive = false; scene?.dispose(); engine.current = null; };
  }, [kind, config, round]);

  async function enterVr() {
    setEntering(true);
    try { await engine.current?.enterVr(); } catch { setError('VR 연결을 시작하지 못했어요. 기기 연결을 확인하고 다시 눌러 주세요.'); }
    finally { setEntering(false); }
  }

  function restart() {
    setPhase('predict'); setPrediction(''); predictionRef.current = '';
    setObserved([]); setPlaced([]); setMessage(config.instruction); setReady(false); setError(''); setSaveError(false); setBusy(false); setInVr(false);
    setRound((value) => value + 1);
  }

  return <main className={`vr-lab-page wet-vr wet-${kind}`} style={{ '--wet-accent': config.accent } as React.CSSProperties}>
    <header className="vr-lab-header">
      <a href="/" aria-label="실험실 홈"><ArrowLeft size={22} /><span>실험실 홈</span></a>
      <div><Icon size={23} /><strong>{config.title}</strong><span>VR</span></div>
      <div className="vr-stars"><Star size={20} fill="currentColor" />{stars} / 18</div>
    </header>
    <section className="vr-viewport" aria-label={`${config.title} VR 실험`}>
      <div className="vr-canvas-mount" ref={mount} />
      {!ready && !error && <div className="vr-loading"><Icon size={36} /><strong>실험 도구 준비 중</strong></div>}
      <div className="vr-top-tools">
        <VrSoundButton />
        {supported && phase !== 'predict' && !inVr && <button className="vr-enter-button" disabled={entering} onClick={() => void enterVr()}><Glasses size={20} />{entering ? '연결 중' : 'VR 입장'}</button>}
        <span className="vr-device-note">{inVr ? 'VR 실험 중' : '화면 3D 모드'}</span>
      </div>
      {error && <div className="wet-error" role="alert">{error}<button onClick={() => { if (ready) setError(''); else restart(); }}>{ready ? '닫기' : '다시 시도'}</button></div>}
      {phase === 'predict' && <div className="vr-panel vr-prediction-panel">
        <span className="vr-kicker">실험 전 예상</span><h1>{config.question}</h1>
        <div className="vr-prediction-options">{config.choices.map((choice) => <button aria-pressed={prediction === choice} className={prediction === choice ? 'selected' : ''} key={choice} onClick={() => { setPrediction(choice); predictionRef.current = choice; }}>{choice}{prediction === choice && <Check size={18} />}</button>)}</div>
        <button className="vr-primary" disabled={!prediction || !ready} onClick={() => { playVrSound('start'); setPhase('experiment'); engine.current?.start(); }}><Play size={19} />실험 시작</button>
      </div>}
      {phase === 'experiment' && <>
        <aside className="vr-panel vr-observation-panel" aria-live="polite">
          <span>{observed.length} / {config.trials.length} 관찰 완료</span>
          <p>{message}</p>
          <small>{config.conditions}</small>
          {['heat', 'seed', 'force', 'earth'].includes(kind) && placed.length === config.trials.length && observed.length < config.trials.length && <button className="vr-primary compact" disabled={busy} onClick={() => engine.current?.runHeat()}><Play size={18} />{busy ? '같은 시간 관찰 중' : kind === 'force' ? '같은 힘으로 밀기' : kind === 'earth' ? '같은 양의 비 내리기' : '같은 시간 관찰하기'}</button>}
          {observed.length === config.trials.length && <button className="vr-primary compact" onClick={() => engine.current?.finish()}><Star size={18} />발견 기록하기</button>}
        </aside>
        <div className={`vr-object-dock wet-dock ${config.trials.length === 4 ? 'wet-dock-four' : ''}`} aria-label="도구 놓기 보조 버튼">{config.trials.map((trial, index) => <button key={trial.name} disabled={placed.includes(index)} className={observed.includes(index) ? 'tested' : ''} onClick={() => engine.current?.place(index)}>{observed.includes(index) ? <Check size={17} /> : <Hand size={17} />}<span>{trial.name}</span></button>)}</div>
      </>}
      {phase === 'complete' && <div className="vr-panel vr-complete-panel" aria-live="polite">
        <Star size={60} className="vr-earned-star" fill="currentColor" /><h1>관찰 성공!</h1><p>{config.discovery}</p>
        {saveError && <p role="alert">이 브라우저에서 기록을 저장하지 못했어요.</p>}
        <div className="vr-complete-actions"><a href={`/reports?id=${kind}`}><FileText size={18} />학부모 리포트</a><a href="/"><Home size={18} />다른 실험</a><button title="다시 실험" aria-label="다시 실험" onClick={restart}><RotateCcw size={20} /></button></div>
      </div>}
    </section>
  </main>;
}
