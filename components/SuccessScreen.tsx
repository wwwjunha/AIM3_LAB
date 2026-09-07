'use client';

import { BookOpen, FileText, Home, RotateCcw, Star } from 'lucide-react';
import { useEffect } from 'react';
import { completeExperiment } from '@/lib/progress';
import type { ExperimentId, ExperimentReportInput } from '@/types/experiment';

export function SuccessScreen({ id, title, report, onRetry }: { id: ExperimentId; title: string; report: ExperimentReportInput; onRetry: () => void }) {
  useEffect(() => completeExperiment(id, report), [id]);
  return (
    <section className="success-screen" aria-live="polite">
      <div className="success-rays" aria-hidden="true" />
      <div className="earned-star"><Star size={92} fill="currentColor" /></div>
      <p>⭐ +1</p>
      <h1>{title} 성공!</h1>
      <span>직접 실험해서 새로운 사실을 발견했어!</span>
      <div className="success-actions">
        <a className="report-link" href={`/reports?id=${id}`}><FileText size={22} /> 학부모 리포트</a>
        <a href="/"><Home size={22} /> 다른 실험 하러 가기</a>
        <a href="/discoveries"><BookOpen size={22} /> 발견 모아보기</a>
        <button onClick={onRetry} aria-label="이 실험 다시 하기"><RotateCcw size={22} /></button>
      </div>
    </section>
  );
}
