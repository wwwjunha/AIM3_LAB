import type { ExperimentId } from '@/types/experiment';

export type Trial = { condition: string; result: string; at: string };
export type Inquiry = { group: string; reason: string; changed: string; kept: string; observation: string; explanation: string; nextQuestion: string; trials: Trial[]; savedAt?: string };
export const emptyInquiry = (): Inquiry => ({ group: '', reason: '', changed: '', kept: '', observation: '', explanation: '', nextQuestion: '', trials: [] });
export function readInquiry(id: ExperimentId): Inquiry {
  if (typeof window === 'undefined') return emptyInquiry();
  try { const value = JSON.parse(localStorage.getItem(`inquiry:${id}`) || 'null'); return value && typeof value === 'object' ? { ...emptyInquiry(), ...value, trials: Array.isArray(value.trials) ? value.trials : [] } : emptyInquiry(); } catch { return emptyInquiry(); }
}
export function saveInquiry(id: ExperimentId, value: Inquiry): boolean {
  try { localStorage.setItem(`inquiry:${id}`, JSON.stringify(value)); window.dispatchEvent(new Event('inquiry-updated')); return true; } catch { return false; }
}
export function recordTrial(id: ExperimentId, condition: string, result: string) {
  const current = readInquiry(id);
  saveInquiry(id, { ...current, trials: [...current.trials, { condition, result, at: new Date().toISOString() }].slice(-100) });
  try { window.dispatchEvent(new CustomEvent<TrialEventDetail>('kongkong-trial', { detail: { id, condition, result, count: current.trials.length + 1 } })); } catch { /* Events are optional feedback. */ }
}
export type TrialEventDetail = { id: ExperimentId; condition: string; result: string; count: number };
export function downloadInquiry(id: ExperimentId, title: string) {
  const value = readInquiry(id);
  const text = [title, `조 / 별명: ${value.group || '미입력'}`, `예상한 이유: ${value.reason}`, `바꾼 조건: ${value.changed}`, `같게 한 조건: ${value.kept}`, '화면 조작 기록', ...value.trials.map((t, i) => `${i + 1}. ${t.condition} → ${t.result}`), `내 관찰: ${value.observation}`, `내 설명: ${value.explanation}`, `다음 질문: ${value.nextQuestion}`, '화면 속 모형의 활동 기록입니다. 학습 성취 점수가 아닙니다.'].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${title}-탐구기록.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
