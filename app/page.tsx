'use client';

import { ArrowRight, Check, FlaskConical, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/progress';

const experiments = [
  { id: 'force', title: '힘 연구소', prompt: '밀어보면 뭐가 다를까?', level: '쉬워요', mark: '📦', accent: 'var(--force)', pale: 'var(--force-pale)' },
  { id: 'matter', title: '물질 연구소', prompt: '물과 돌을 비교해보자!', level: '쉬워요', mark: '💧', accent: 'var(--matter)', pale: 'var(--matter-pale)' },
  { id: 'sound', title: '소리 연구소', prompt: '고무줄 기타를 연주해보자!', level: '도전!', mark: '🎸', accent: 'var(--sound)', pale: 'var(--sound-pale)' },
] as const;

export default function Home() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(experiments.filter(({ id }) => localStorage.getItem(`${id}Completed`) === 'true').map(({ id }) => id));

    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'get_experiment_progress', title: '실험 진행 상태 보기',
      description: '완료한 실험과 획득한 별을 확인합니다.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => getProgress(),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: 'start_science_experiment', title: '과학 실험 시작하기',
      description: '힘, 물질, 소리 중 하나의 실험 화면을 엽니다.',
      inputSchema: { type: 'object', properties: { experiment: { type: 'string', enum: ['force', 'matter', 'sound'] } }, required: ['experiment'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const experiment = (input as { experiment?: string }).experiment;
        if (!['force', 'matter', 'sound'].includes(experiment || '')) throw new Error('지원하지 않는 실험입니다.');
        location.href = `/experiment/${experiment}`;
        return { opened: experiment };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const allComplete = completed.length === experiments.length;

  return (
    <main className="home-page">
      <div className="sky-grid" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="콩콩 과학실험실 홈">
          <span className="brand-icon"><FlaskConical size={25} strokeWidth={2.5} /></span>
          <span>콩콩 과학실험실</span>
        </a>
        <div className="star-meter" aria-label={`별 ${completed.length}개 중 3개`}>
          <Star size={21} fill="currentColor" /><span>나의 별</span><strong>{completed.length} / 3</strong>
        </div>
      </header>

      <section className="home-intro" aria-labelledby="home-title">
        <div className="intro-copy">
          <p className="eyebrow"><Sparkles size={17} /> 오늘의 실험 준비 완료!</p>
          <h1 id="home-title">누르고, 움직이고,<br /><em>직접 실험해봐!</em></h1>
          <div className="speech-bubble">오늘은 어떤 실험을 해볼까?</div>
        </div>
        <img className="mascot" src="/kongkong-doctor.png" alt="고글과 흰 가운을 입고 손을 흔드는 콩콩 박사" />
      </section>

      {allComplete && (
        <section className="completion-banner" aria-live="polite">
          <div className="completion-medal">🏅</div>
          <div><span>오늘의 꼬마 과학자!</span><strong>3개의 실험을 모두 완료했어요!</strong></div>
          <a href="/discoveries">내가 발견한 것 <ArrowRight size={20} /></a>
        </section>
      )}

      <section className="lab-section" aria-labelledby="lab-heading">
        <div className="section-heading">
          <div><span>LAB MAP</span><h2 id="lab-heading">어디부터 가볼까?</h2></div>
          <p>마음에 드는 실험을 골라 봐.</p>
        </div>
        <div className="lab-grid">
          {experiments.map((experiment, index) => {
            const isComplete = completed.includes(experiment.id);
            return (
              <article className="lab-card" key={experiment.id} style={{ '--lab-accent': experiment.accent, '--lab-pale': experiment.pale } as React.CSSProperties}>
                <div className="card-topline"><span>0{index + 1}</span>{isComplete && <span className="complete-tag"><Check size={16} /> 완료</span>}</div>
                <div className="experiment-mark" aria-hidden="true">{experiment.mark}</div>
                <h3>{experiment.title}</h3>
                <p>{experiment.prompt}</p>
                <div className="card-footer">
                  <span className="level"><Star size={17} fill="currentColor" /> {experiment.level}</span>
                  <a className="start-button" href={`/experiment/${experiment.id}`}>
                    {isComplete ? <RotateCcw size={20} /> : <FlaskConical size={20} />}{isComplete ? '다시 하기' : '실험 시작'}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
