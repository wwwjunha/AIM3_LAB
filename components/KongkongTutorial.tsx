'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExperimentId } from '@/types/experiment';
import { lessonCatalog } from '@/lib/lessonCatalog';

const SEEN_KEY = 'kongkongTutorialSeen';

type Slide = { target?: string; title: string; text: string };

function slidesFor(id: ExperimentId, title: string): Slide[] {
  const lesson = lessonCatalog[id];
  return [
    { title: `안녕! 나는 콩콩 박사야`, text: `오늘은 ${title}에서 같이 실험해 볼 거야. 화면을 하나씩 보여 줄게.` },
    { target: '.stepper', title: '실험은 다섯 단계야', text: '궁금해요 → 예상해요 → 실험해요 → 발견했어요 → 성공! 지금 어디쯤인지 여기서 볼 수 있어.' },
    { target: '.experiment-stage', title: '여기서 직접 실험해', text: `가운데 화면을 누르고 움직여 봐. 이 실험에서는 이렇게 해 보자: ${lesson.observe}` },
    { target: '.experiment-stage .primary-button', title: '다 했으면 큰 버튼!', text: '한 단계를 마치면 아래쪽 큰 버튼을 눌러 다음 단계로 가. 아직 할 일이 남았으면 버튼이 흐리게 보여.' },
    { target: '.inquiry-panel', title: '탐구 노트에 기록이 쌓여', text: '실험에서 조작한 조건과 결과는 자동으로 적혀. 내 예상의 이유와 설명은 직접 써 줘.' },
    { target: '.experiment-tools', title: '도구 모음', text: '선생님용 지도안·활동지, 교실 TV용 큰 화면, 소리 켜기·끄기가 여기 있어. 나를 다시 부르려면 “콩콩이 설명”을 눌러.' },
    { target: '.compact-stars', title: '끝까지 하면 별을 받아', text: '실험을 마치면 별 하나와 보호자에게 보여 줄 리포트가 생겨. 그럼 시작해 볼까?' },
  ];
}

/** Step-by-step guide that points at each part of the experiment screen. */
export function KongkongTutorial({ id, title, step, open, onClose }: { id: ExperimentId; title: string; step: number; open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const slides = slidesFor(id, title);
  const slide = slides[Math.min(index, slides.length - 1)];
  const targetSelector = slide.target;

  useEffect(() => { if (open) setIndex(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    // A target can be missing on some steps (e.g. no big button on the success screen); the card still shows.
    const target = targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null;
    target?.classList.add('tutorial-focus');
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    card.current?.focus({ preventScroll: true });
    return () => target?.classList.remove('tutorial-focus');
  }, [open, targetSelector, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeGuide(onClose); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const close = () => closeGuide(onClose);

  if (!open) return null;
  const last = index >= slides.length - 1;
  return <div className="tutorial-layer">
    <div className="tutorial-card" role="dialog" aria-modal="false" aria-labelledby="tutorial-title" tabIndex={-1} ref={card}>
      <img src="/kongkong-doctor.png" alt="콩콩 박사" />
      <div>
        <span className="tutorial-count">{index + 1} / {slides.length}</span>
        <h2 id="tutorial-title">{slide.title}</h2>
        <p>{slide.text}</p>
        <div className="tutorial-actions">
          <button type="button" onClick={close}>건너뛰기</button>
          {index > 0 && <button type="button" onClick={() => setIndex(index - 1)}>이전</button>}
          <button type="button" className="tutorial-next" onClick={() => (last ? close() : setIndex(index + 1))}>{last ? '실험 시작!' : '다음'}</button>
        </div>
      </div>
    </div>
  </div>;
}

function closeGuide(onClose: () => void) {
  try { localStorage.setItem(SEEN_KEY, 'true'); } catch { /* The guide still closes without storage. */ }
  onClose();
}

export function tutorialSeen() {
  try { return localStorage.getItem(SEEN_KEY) === 'true'; } catch { return true; }
}
