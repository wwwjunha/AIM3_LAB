import type { ExperimentReport } from '@/types/experiment';
import type { Inquiry, Trial } from '@/lib/inquiry';
import type { Lesson } from '@/lib/lessonCatalog';

export type ParentInsights = {
  summary: string;
  trials: Trial[];
  minutes: number | null;
  strengths: string[];
  nextSteps: string[];
  checkPoint: string;
  challenge: string;
};

/** Picks 은/는, 이/가 and so on from whether the last Hangul syllable has a final consonant. */
export function josa(word: string, withFinal: string, withoutFinal: string) {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return withoutFinal;
  return (code - 0xac00) % 28 ? withFinal : withoutFinal;
}

/** 으로/로: words ending in a vowel or ㄹ take 로 (철로, 나무로), others take 으로. */
export function euro(word: string) {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '로';
  const final = (code - 0xac00) % 28;
  return final === 0 || final === 8 ? '로' : '으로';
}

function quote(text: string, max = 70) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return `“${clean.length > max ? `${clean.slice(0, max)}…` : clean}”`;
}

/** Trials logged during this run of the experiment; falls back to everything if timestamps don't line up. */
function trialsForRun(report: ExperimentReport, all: Trial[]) {
  const start = Date.parse(report.startedAt) - 60_000;
  const end = Date.parse(report.completedAt) + 60_000;
  const inRun = all.filter((trial) => { const at = Date.parse(trial.at); return at >= start && at <= end; });
  return inRun.length ? inRun : all;
}

/**
 * Builds report text from what this child actually did (trials, notebook entries, retries).
 * It describes activity, not ability: no scores or grades are derived here.
 */
export function buildParentInsights(report: ExperimentReport, inquiry: Inquiry | null, lesson: Lesson, childName: string): ParentInsights {
  const name = childName.trim();
  const who = name ? `${name}${josa(name, '이는', '는')}` : '아이는';
  const trials = trialsForRun(report, inquiry?.trials ?? []);
  const distinct = new Set(trials.map((trial) => trial.condition)).size;
  const repeated = trials.length > distinct;
  const elapsed = (Date.parse(report.completedAt) - Date.parse(report.startedAt)) / 60_000;
  const minutes = elapsed > 0 && elapsed < 180 ? Math.max(1, Math.round(elapsed)) : null;
  const date = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(report.completedAt));

  const summary = `${who} ${date}에 “${report.question}”를 탐구했어요. 실험 전에 ‘${report.prediction}’라고 예상했고, `
    + (trials.length ? `화면에서 ${trials.length}번 직접 조작하며 ${distinct}가지 조건의 결과를 확인했어요.` : '실험 단계를 차례로 진행하며 결과를 확인했어요.')
    + (minutes ? ` 활동 시간은 약 ${minutes}분이었어요.` : '');

  const strengths: string[] = [];
  if (distinct >= 2) strengths.push(`서로 다른 조건 ${distinct}가지를 직접 바꿔 가며 비교했어요.`);
  else if (trials.length) strengths.push('직접 조작하며 결과를 눈으로 확인했어요.');
  if (repeated) strengths.push('같은 조건을 한 번 더 시험해 결과가 같은지 확인했어요. 과학자들이 하는 반복 확인이에요.');
  if (report.retryCount > 0) strengths.push(`실험을 ${report.retryCount}번 다시 도전했어요. 끝까지 해 보려는 태도가 보여요.`);
  if (inquiry?.reason.trim()) strengths.push(`예상한 이유를 스스로 적었어요: ${quote(inquiry.reason)}`);
  if (inquiry?.changed.trim() && inquiry.kept.trim()) strengths.push('바꾼 조건과 같게 둔 조건을 구분해 적었어요. 공정한 비교의 핵심이에요.');
  if (inquiry?.explanation.trim()) strengths.push(`관찰을 근거로 자기 말로 설명했어요: ${quote(inquiry.explanation)}`);
  if (inquiry?.nextQuestion.trim()) strengths.push(`새로운 궁금증을 남겼어요: ${quote(inquiry.nextQuestion)}`);
  if (!strengths.length) strengths.push('궁금해요부터 발견했어요까지 실험 단계를 끝까지 마쳤어요.');

  const nextSteps: string[] = [];
  if (!inquiry?.explanation.trim()) nextSteps.push('“왜 그렇게 됐을까?”라고 물어봐 주세요. 정답보다 아이가 본 결과를 근거로 말하는 것이 중요해요.');
  if (!inquiry?.reason.trim()) nextSteps.push('다음 실험 전에는 “어떻게 될 것 같아? 왜 그렇게 생각해?”를 먼저 물어봐 주세요.');
  if (!(inquiry?.changed.trim() && inquiry.kept.trim())) nextSteps.push(`이 실험에서 바꾼 것은 ‘${lesson.change}’, 같게 둔 것은 ‘${lesson.keep}’이에요. 집에서 비교 놀이를 할 때 함께 짚어 주세요.`);
  if (distinct < 2) nextSteps.push('결과를 하나만 보기보다 다른 조건과 나란히 비교해 보도록 권해 주세요.');

  return { summary, trials, minutes, strengths, nextSteps: nextSteps.slice(0, 3), checkPoint: lesson.misconception, challenge: lesson.challenge };
}
