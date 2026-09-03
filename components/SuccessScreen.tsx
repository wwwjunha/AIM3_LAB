'use client';

import { BookOpen, Home, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { completeExperiment } from '@/lib/progress';
import type { ExperimentId } from '@/types/experiment';

export function SuccessScreen({ id, title, onRetry }: { id: ExperimentId; title: string; onRetry: () => void }) {
  useEffect(() => completeExperiment(id), [id]);
  return (
    <section className="success-screen" aria-live="polite">
      <div className="success-rays" aria-hidden="true" />
      <div className="earned-star"><Star size={92} fill="currentColor" /></div>
      <p>⭐ +1</p>
      <h1>{title} 성공!</h1>
      <span>직접 실험해서 새로운 사실을 발견했어!</span>
      <div className="success-actions">
        <Link href="/"><Home size={22} /> 다른 실험 하러 가기</Link>
        <Link href="/discoveries"><BookOpen size={22} /> 발견 모아보기</Link>
        <button onClick={onRetry} aria-label="이 실험 다시 하기"><RotateCcw size={22} /></button>
      </div>
    </section>
  );
}
