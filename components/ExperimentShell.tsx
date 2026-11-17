'use client';

import { FlaskConical, Home, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getProgress, resetProgress, startExperiment } from '@/lib/progress';
import { experimentIds, type ExperimentId, type ProgressSnapshot } from '@/types/experiment';
import { InquiryNotebook } from '@/components/InquiryNotebook';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { KongkongBuddy } from '@/components/KongkongBuddy';
import { KongkongTutorial, tutorialSeen } from '@/components/KongkongTutorial';
import VrSoundButton from '@/components/vr/VrSoundButton';
import { ChallengeStage, OrganizeStage, ReasonStage } from '@/components/ExtraStages';

const stepNames = ['궁금해요', '예상해요', '실험해요', '정리해요', '발견했어요', '도전해요', '성공!'];

type Gate = 'reason' | 'organize' | 'challenge' | null;

/** Experiments report steps 0–4; the shell adds its own stages between them, so the stepper shows 7. */
function displayStep(step: number, gate: Gate) {
  if (gate === 'reason') return 1;
  if (gate === 'organize') return 3;
  if (gate === 'challenge') return 5;
  return [0, 1, 2, 4, 6][step] ?? step;
}

export function ExperimentShell({ id, title, step, accent, children }: { id: ExperimentId; title: string; step: number; accent: string; children: React.ReactNode }) {
  const [debug, setDebug] = useState(false);
  const [large, setLarge] = useState(false);
  const [guide, setGuide] = useState(false);
  const [reasonDone, setReasonDone] = useState(false);
  const [organizeDone, setOrganizeDone] = useState(false);
  const [challengeDone, setChallengeDone] = useState(false);
  const [runStart, setRunStart] = useState(() => Date.now());
  const gate: Gate = step === 2 && !reasonDone ? 'reason' : step === 3 && !organizeDone ? 'organize' : step === 4 && !challengeDone ? 'challenge' : null;
  const shown = displayStep(step, gate);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    startExperiment(id);
    setDebug(new URLSearchParams(location.search).get('debug') === '1');
    if (!tutorialSeen()) setGuide(true);
  }, [id]);

  useEffect(() => {
    setSnapshot(getProgress());
    if (step === 0) {
      // A new run (first visit or 다시 하기): every added stage starts over.
      setReasonDone(false); setOrganizeDone(false); setChallengeDone(false); setRunStart(Date.now());
    }
  }, [step]);

  const lastShown = useRef(shown);
  useEffect(() => {
    // Bring the new stage into view when the step changes, but not on first load.
    if (lastShown.current !== shown) document.querySelector('.stepper')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    lastShown.current = shown;
  }, [shown]);

  function clear() {
    resetProgress();
    setSnapshot(getProgress());
    location.reload();
  }

  return (
    <main className={`experiment-page ${accent} ${large ? 'presentation-mode' : ''}`}>
      <header className="experiment-header">
        <a href="/" className="home-link" aria-label="실험실 홈으로"><Home size={23} /><span>실험실 홈</span></a>
        <div className="experiment-title"><FlaskConical size={22} />{title}</div>
        <div className="compact-stars"><Star size={20} fill="currentColor" /> {snapshot?.totalStars ?? 0} / {experimentIds.length}</div>
      </header>
      <div className="experiment-tools"><a href={`/lessons?id=${id}`}>📚 지도안 · 활동지</a><a href="/classroom">수업 준비</a><button aria-pressed={large} onClick={() => setLarge(!large)}>{large ? '기본 화면' : '큰 화면'}</button><button className="guide-open" onClick={() => setGuide(true)}>❔ 콩콩이 설명</button><VrSoundButton /><span>{lessonCatalog[id].area} · 약 {lessonCatalog[id].minutes}분</span></div>
      <nav className="stepper" aria-label="실험 진행 단계">
        {stepNames.map((name, index) => <div className={index === shown ? 'current' : index < shown ? 'done' : ''} key={name}><span>{index < shown ? '✓' : index + 1}</span><strong>{name}</strong></div>)}
      </nav>
      <div className="experiment-stage">
        {gate === 'reason' ? <ReasonStage id={id} onDone={() => setReasonDone(true)} />
          : gate === 'organize' ? <OrganizeStage id={id} runStart={runStart} onDone={() => setOrganizeDone(true)} />
          : gate === 'challenge' ? <ChallengeStage id={id} onDone={() => setChallengeDone(true)} />
          : children}
      </div>
      <div className="experiment-support"><InquiryNotebook id={id} /><details className="model-notice"><summary>더 탐구하기 · 모형 안내</summary><p>{lessonCatalog[id].challenge}</p><p>{lessonCatalog[id].limitation}</p></details></div>
      <KongkongBuddy id={id} />
      <KongkongTutorial id={id} title={title} step={step} open={guide} onClose={() => setGuide(false)} />
      {debug && snapshot && (
        <aside className="debug-panel">
          <strong>DEBUG</strong>
          <span>현재 실험: {id} / 단계 {shown + 1} ({gate ?? 'experiment'})</span>
          <span>별: {snapshot.totalStars} / {experimentIds.length}</span>
          {experimentIds.map((item) => <span key={item}>{item}: {snapshot[`${item}Completed`] ? '완료' : '진행 전'} / 재시도 {snapshot.records[item].retryCount}</span>)}
          <button onClick={clear}>localStorage 초기화</button>
        </aside>
      )}
    </main>
  );
}
