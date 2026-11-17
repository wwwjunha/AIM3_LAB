'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ExperimentId } from '@/types/experiment';
import type { TrialEventDetail } from '@/lib/inquiry';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { playVrSound, type VrSoundCue } from '@/lib/vrAudio';

// Experiments that already make their own sound (sound strings, magnet clicks) are left out.
const trialCue: Partial<Record<ExperimentId, VrSoundCue>> = {
  force: 'slide', matter: 'pour', light: 'light', air: 'bubble', heat: 'water', plant: 'grow', earth: 'rain',
  float: 'water', dissolve: 'stir', circuit: 'circuit', seed: 'grow', friction: 'slide', absorb: 'water',
  color: 'stir', surface: 'water', reaction: 'fizz',
};

const cheers = ['오, 봤어?', '좋은 관찰이야!', '기록했어!', '변화가 보이지?', '과학자처럼 비교 중이야!'];

type Bubble = { title: string; text: string; hint: string; key: number };

/** Kongkong reacts to every trial the child runs, so the character takes part in the experiment itself. */
export function KongkongBuddy({ id }: { id: ExperimentId }) {
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const lesson = lessonCatalog[id];
    const hints = [
      `바꾼 것: ${lesson.change}. 같게 둔 것도 확인해 봐.`,
      `${lesson.observe}`,
      '예상과 같았어? 다르면 왜 그럴지 탐구 노트에 적어 봐.',
      `같게 둔 것: ${lesson.keep}`,
    ];
    function onTrial(event: Event) {
      const detail = (event as CustomEvent<TrialEventDetail>).detail;
      if (!detail || detail.id !== id) return;
      count.current += 1;
      const n = count.current;
      const cue = trialCue[id];
      if (cue) playVrSound(cue);
      const hint = n === 1 ? '첫 번째 기록이야! 아래 탐구 노트에 자동으로 적혀.'
        : n === 2 ? '아까 결과와 비교해 봐. 무엇이 달라졌지?'
        : hints[(n - 3) % hints.length];
      setBubble({ title: cheers[(n - 1) % cheers.length], text: `${detail.condition} → ${detail.result}`, hint, key: n });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBubble(null), 7000);
    }
    window.addEventListener('kongkong-trial', onTrial);
    return () => { window.removeEventListener('kongkong-trial', onTrial); if (timer.current) clearTimeout(timer.current); };
  }, [id]);

  return <aside className={`kongkong-buddy ${bubble ? 'talking' : ''}`} aria-live="polite">
    {bubble && <div className="buddy-bubble" key={bubble.key}>
      <button type="button" aria-label="말풍선 닫기" onClick={() => setBubble(null)}><X size={16} /></button>
      <strong>{bubble.title}</strong><p>{bubble.text}</p><small>{bubble.hint}</small>
    </div>}
    <img src="/kongkong-doctor.png" alt="" aria-hidden="true" />
  </aside>;
}
