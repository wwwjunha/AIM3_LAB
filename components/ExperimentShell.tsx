'use client';

import { FlaskConical, Home, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, resetProgress, startExperiment } from '@/lib/progress';
import type { ExperimentId, ProgressSnapshot } from '@/types/experiment';

const stepNames = ['궁금해요', '예상해요', '실험해요', '발견했어요', '성공!'];

export function ExperimentShell({ id, title, step, accent, children }: { id: ExperimentId; title: string; step: number; accent: string; children: React.ReactNode }) {
  const [debug, setDebug] = useState(false);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    startExperiment(id);
    setDebug(new URLSearchParams(location.search).get('debug') === '1');
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
    <main className={`experiment-page ${accent}`}>
      <header className="experiment-header">
        <Link href="/" className="home-link" aria-label="실험실 홈으로"><Home size={23} /><span>실험실 홈</span></Link>
        <div className="experiment-title"><FlaskConical size={22} />{title}</div>
        <div className="compact-stars"><Star size={20} fill="currentColor" /> {snapshot?.totalStars ?? 0} / 3</div>
      </header>
      <nav className="stepper" aria-label="실험 진행 단계">
        {stepNames.map((name, index) => <div className={index === step ? 'current' : index < step ? 'done' : ''} key={name}><span>{index < step ? '✓' : index + 1}</span><strong>{name}</strong></div>)}
      </nav>
      <div className="experiment-stage">{children}</div>
      {debug && snapshot && (
        <aside className="debug-panel">
          <strong>DEBUG</strong>
          <span>현재 실험: {id} / 단계 {step + 1}</span>
          <span>별: {snapshot.totalStars} / 3</span>
          {(['force', 'matter', 'sound'] as ExperimentId[]).map((item) => <span key={item}>{item}: {snapshot[`${item}Completed`] ? '완료' : '진행 전'} / 재시도 {snapshot.records[item].retryCount}</span>)}
          <button onClick={clear}>localStorage 초기화</button>
        </aside>
      )}
    </main>
  );
}
