'use client';

import { FlaskConical, Home, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, resetProgress, startExperiment } from '@/lib/progress';
import { experimentIds, type ExperimentId, type ProgressSnapshot } from '@/types/experiment';
import { InquiryNotebook } from '@/components/InquiryNotebook';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { KongkongBuddy } from '@/components/KongkongBuddy';
import { KongkongTutorial, tutorialSeen } from '@/components/KongkongTutorial';
import VrSoundButton from '@/components/vr/VrSoundButton';

const stepNames = ['궁금해요', '예상해요', '실험해요', '발견했어요', '성공!'];

export function ExperimentShell({ id, title, step, accent, children }: { id: ExperimentId; title: string; step: number; accent: string; children: React.ReactNode }) {
  const [debug, setDebug] = useState(false);
  const [large, setLarge] = useState(false);
  const [guide, setGuide] = useState(false);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    startExperiment(id);
    setDebug(new URLSearchParams(location.search).get('debug') === '1');
    if (!tutorialSeen()) setGuide(true);
  }, [id]);

  useEffect(() => {
    setSnapshot(getProgress());
  }, [step]);

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
        {stepNames.map((name, index) => <div className={index === step ? 'current' : index < step ? 'done' : ''} key={name}><span>{index < step ? '✓' : index + 1}</span><strong>{name}</strong></div>)}
      </nav>
      <div className="experiment-stage">{children}</div>
      <div className="experiment-support"><InquiryNotebook id={id} /><details className="model-notice"><summary>더 탐구하기 · 모형 안내</summary><p>{lessonCatalog[id].challenge}</p><p>{lessonCatalog[id].limitation}</p></details></div>
      <KongkongBuddy id={id} />
      <KongkongTutorial id={id} title={title} step={step} open={guide} onClose={() => setGuide(false)} />
      {debug && snapshot && (
        <aside className="debug-panel">
          <strong>DEBUG</strong>
          <span>현재 실험: {id} / 단계 {step + 1}</span>
          <span>별: {snapshot.totalStars} / {experimentIds.length}</span>
          {experimentIds.map((item) => <span key={item}>{item}: {snapshot[`${item}Completed`] ? '완료' : '진행 전'} / 재시도 {snapshot.records[item].retryCount}</span>)}
          <button onClick={clear}>localStorage 초기화</button>
        </aside>
      )}
    </main>
  );
}
