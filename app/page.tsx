'use client';

import { ArrowRight, Check, FlaskConical, Glasses, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/progress';
import { experimentIds } from '@/types/experiment';

const experiments = [
  { id: 'force', title: '힘 연구소', prompt: '밀어보면 뭐가 다를까?', level: '쉬워요', mark: '📦', accent: 'var(--force)', pale: 'var(--force-pale)' },
  { id: 'matter', title: '물질 연구소', prompt: '물과 돌을 비교해보자!', level: '쉬워요', mark: '💧', accent: 'var(--matter)', pale: 'var(--matter-pale)' },
  { id: 'sound', title: '소리 연구소', prompt: '고무줄 기타를 연주해보자!', level: '도전!', mark: '🎸', accent: 'var(--sound)', pale: 'var(--sound-pale)' },
  { id: 'magnet', title: '자석 연구소', prompt: '어떤 물체가 자석에 붙을까?', level: '쉬워요', mark: '🧲', accent: 'var(--magnet)', pale: 'var(--magnet-pale)' },
  { id: 'light', title: '빛 연구소', prompt: '그림자 크기를 바꿔보자!', level: '관찰!', mark: '🔦', accent: 'var(--light)', pale: 'var(--light-pale)' },
  { id: 'air', title: '공기 연구소', prompt: '빈 컵 속에는 무엇이 있을까?', level: '도전!', mark: '🫧', accent: 'var(--air)', pale: 'var(--air-pale)' },
  { id: 'heat', title: '온도 연구소', prompt: '얼음은 어디서 빨리 녹을까?', level: '관찰!', mark: '🧊', accent: 'var(--heat)', pale: 'var(--heat-pale)' },
  { id: 'plant', title: '식물 연구소', prompt: '색깔 물은 어디로 갈까?', level: '관찰!', mark: '🌱', accent: 'var(--plant)', pale: 'var(--plant-pale)' },
  { id: 'earth', title: '땅 연구소', prompt: '비가 오면 흙은 어떻게 될까?', level: '도전!', mark: '⛰️', accent: 'var(--earth)', pale: 'var(--earth-pale)' },
  { id: 'float', title: '뜨고 가라앉기 연구소', prompt: '어떤 물체가 물에 뜰까?', level: '관찰!', mark: '🛟', accent: 'var(--float)', pale: 'var(--float-pale)' },
  { id: 'dissolve', title: '용해 연구소', prompt: '물에 녹는 물질을 찾아보자!', level: '도전!', mark: '🥄', accent: 'var(--dissolve)', pale: 'var(--dissolve-pale)' },
  { id: 'circuit', title: '전기 회로 연구소', prompt: '전구에 불을 켜보자!', level: '도전!', mark: '💡', accent: 'var(--circuit)', pale: 'var(--circuit-pale)' },
  { id: 'seed', title: '씨앗 연구소', prompt: '씨앗은 언제 싹이 날까?', level: '관찰!', mark: '🌰', accent: 'var(--seed)', pale: 'var(--seed-pale)' },
  { id: 'friction', title: '마찰 연구소', prompt: '자동차는 어디서 멀리 갈까?', level: '도전!', mark: '🛝', accent: 'var(--friction)', pale: 'var(--friction-pale)' },
  { id: 'absorb', title: '흡수 연구소', prompt: '물을 잘 흡수하는 재료는?', level: '쉬워요', mark: '🧽', accent: 'var(--absorb)', pale: 'var(--absorb-pale)' },
  { id: 'color', title: '색 혼합 연구소', prompt: '두 색을 섞어 새 색을 만들자!', level: '쉬워요', mark: '🎨', accent: 'var(--color)', pale: 'var(--color-pale)' },
  { id: 'surface', title: '표면 장력 연구소', prompt: '비누가 후추를 움직일까?', level: '도전!', mark: '🫧', accent: 'var(--surface)', pale: 'var(--surface-pale)' },
  { id: 'reaction', title: '반응 연구소', prompt: '거품으로 풍선을 부풀려보자!', level: '도전!', mark: '🎈', accent: 'var(--reaction)', pale: 'var(--reaction-pale)' },
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
      description: '콩콩 과학실험실의 열여덟 가지 실험 중 하나를 엽니다.',
      inputSchema: { type: 'object', properties: { experiment: { type: 'string', enum: experimentIds } }, required: ['experiment'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input: unknown) => {
        const experiment = (input as { experiment?: string }).experiment;
        if (!experimentIds.includes(experiment as (typeof experimentIds)[number])) throw new Error('지원하지 않는 실험입니다.');
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
        <div className="star-meter" aria-label={`별 ${completed.length}개 중 ${experiments.length}개`}>
          <Star size={21} fill="currentColor" /><span>나의 별</span><strong>{completed.length} / {experiments.length}</strong>
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
          <div><span>오늘의 꼬마 과학자!</span><strong>{experiments.length}개의 실험을 모두 완료했어요!</strong></div>
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
                <div className="card-topline"><span>{String(index + 1).padStart(2, '0')}</span>{isComplete && <span className="complete-tag"><Check size={16} /> 완료</span>}</div>
                <div className="experiment-mark" aria-hidden="true">{experiment.mark}</div>
                <h3>{experiment.title}</h3>
                <p>{experiment.prompt}</p>
                <div className="card-footer">
                  <span className="level"><Star size={17} fill="currentColor" /> {experiment.level}</span>
                  <div className="card-actions">
                    {experiment.id === 'float' && <a className="vr-card-button" href="/vr/float" aria-label="뜨고 가라앉기 3D VR 시제품" title="3D·VR 시제품"><Glasses size={21} /><span>VR</span></a>}
                    <a className="start-button" href={`/experiment/${experiment.id}`}>
                      {isComplete ? <RotateCcw size={20} /> : <FlaskConical size={20} />}{isComplete ? '다시 하기' : '실험 시작'}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
