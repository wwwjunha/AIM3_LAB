'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import type { ExperimentId } from '@/types/experiment';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { readInquiry, saveInquiry, type Trial } from '@/lib/inquiry';
import { reasonOptions, sortGroupLabel, stageCatalog, type SortGroup } from '@/lib/stageCatalog';
import { playVrSound } from '@/lib/vrAudio';

type StageProps = { id: ExperimentId; onDone: () => void };

/** Fill a notebook field only if the child left it empty, so we never overwrite their own words. */
function fillEmpty(id: ExperimentId, fields: Partial<Record<'reason' | 'changed' | 'kept' | 'observation', string>>) {
  const current = readInquiry(id);
  const next = { ...current };
  for (const [key, value] of Object.entries(fields) as [keyof typeof fields, string][]) {
    if (value && !current[key].trim()) next[key] = value;
  }
  saveInquiry(id, next);
}

/** After predicting: why do you think so? */
export function ReasonStage({ id, onDone }: StageProps) {
  const [choice, setChoice] = useState('');
  const [text, setText] = useState('');
  return <section className="prediction-screen extra-stage">
    <ScientistGuide>좋아, 예상을 골랐어! 그런데 왜 그렇게 생각했어?</ScientistGuide>
    <h1>내 예상의 이유는?</h1>
    <div className="choice-grid reason-grid">{reasonOptions.map((item) => <button key={item} className={choice === item ? 'selected' : ''} aria-pressed={choice === item} onClick={() => setChoice(item)}>{choice === item && <Check size={22} />}{item}</button>)}</div>
    <label className="stage-textarea">내 말로 더 적어 볼까? (선택)<textarea rows={2} maxLength={300} value={text} onChange={(event) => setText(event.target.value)} placeholder="예: 전에 냉장고에 자석이 붙는 걸 봤어." /></label>
    <PrimaryButton tone={id} disabled={!choice} onClick={() => { fillEmpty(id, { reason: text.trim() ? `${choice} — ${text.trim()}` : choice }); onDone(); }}>실험하러 가기</PrimaryButton>
  </section>;
}

/** After the hands-on part: compare two of your own records, then sort the fair-test variables. */
export function OrganizeStage({ id, onDone, runStart }: StageProps & { runStart: number }) {
  const [trials] = useState<Trial[]>(() => {
    const all = readInquiry(id).trials.filter((trial) => Date.parse(trial.at) >= runStart - 1000);
    // Keep one entry per condition (the latest) so the list stays readable.
    const latest = new Map<string, Trial>();
    all.forEach((trial) => latest.set(trial.condition, trial));
    return [...latest.values()].slice(-8);
  });
  const items = stageCatalog[id].sort;
  const [picked, setPicked] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, SortGroup>>({});
  const [checked, setChecked] = useState(false);
  const needCompare = trials.length >= 2;
  const compareDone = !needCompare || picked.length === 2;
  const allAnswered = items.every((item) => answers[item.label]);
  const allRight = items.every((item) => answers[item.label] === item.group);

  function togglePick(index: number) {
    setPicked((old) => old.includes(index) ? old.filter((value) => value !== index) : old.length >= 2 ? [old[1], index] : [...old, index]);
  }

  function check() {
    setChecked(true);
    playVrSound(allRight ? 'success' : 'select');
  }

  function finish() {
    const [a, b] = picked.map((index) => trials[index]);
    fillEmpty(id, {
      changed: items.filter((item) => item.group === 'change').map((item) => item.label).join(', '),
      kept: items.filter((item) => item.group === 'keep').map((item) => item.label).join(', '),
      observation: a && b ? `${a.condition}: ${a.result} / ${b.condition}: ${b.result}` : '',
    });
    onDone();
  }

  return <section className="hands-on-screen extra-stage organize-stage">
    <ScientistGuide>발견하기 전에 내 실험을 정리해 보자. 진짜 과학자들도 이렇게 해!</ScientistGuide>
    <h1>실험 결과 정리하기</h1>
    {needCompare && <div className="stage-card">
      <h2>① 비교할 기록 두 개 고르기</h2>
      <p>결과가 가장 달랐던 두 기록을 골라 봐.</p>
      <div className="record-pick">{trials.map((trial, index) => <button key={`${trial.condition}-${index}`} aria-pressed={picked.includes(index)} onClick={() => togglePick(index)}><strong>{trial.condition}</strong><span>{trial.result}</span></button>)}</div>
      {picked.length === 2 && <p className="compare-sentence"><b>{trials[picked[0]].condition}</b>일 때는 “{trials[picked[0]].result}” 그런데 <b>{trials[picked[1]].condition}</b>일 때는 “{trials[picked[1]].result}”</p>}
    </div>}
    <div className="stage-card">
      <h2>{needCompare ? '②' : '①'} 공정한 비교 정리하기</h2>
      <p>각 카드가 <b>바꾼 것</b>인지, <b>같게 둔 것</b>인지, <b>관찰한 결과</b>인지 골라 봐.</p>
      <div className="sort-list">{items.map((item) => {
        const answer = answers[item.label];
        const state = checked && answer ? (answer === item.group ? 'right' : 'wrong') : '';
        return <div key={item.label} className={`sort-row ${state}`}>
          <strong>{item.label}</strong>
          <div role="group" aria-label={`${item.label} 분류`}>{(Object.keys(sortGroupLabel) as SortGroup[]).map((group) => <button key={group} aria-pressed={answer === group} onClick={() => { setAnswers((old) => ({ ...old, [item.label]: group })); setChecked(false); }}>{sortGroupLabel[group]}</button>)}</div>
          {state === 'wrong' && <small>다시 생각해 봐! 실험하면서 내가 일부러 바꾼 건 하나뿐이었어.</small>}
        </div>;
      })}</div>
      <div className="stage-actions"><button className="stage-check" disabled={!allAnswered} onClick={check}>정리 확인하기</button>{checked && allRight && <span className="stage-ok">완벽해! 바꾼 건 하나, 나머지는 같게 했지?</span>}</div>
    </div>
    <PrimaryButton tone={id} disabled={!compareDone || !(checked && allRight)} onClick={finish}>발견하러 가기</PrimaryButton>
  </section>;
}

/** After the discovery: apply it to new, everyday situations. */
export function ChallengeStage({ id, onDone }: StageProps) {
  const questions = stageCatalog[id].challenges;
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const answer = question.options[0];
  // Rotate the options so the right answer is not always in the same place.
  const shown = question.options.map((_, i) => question.options[(i + index + 1) % question.options.length]);
  const correct = chosen === answer;
  const score = firstTry.filter(Boolean).length;

  function choose(option: string) {
    if (correct) return;
    setChosen(option);
    if (firstTry.length === index) setFirstTry((old) => [...old, option === answer]);
    playVrSound(option === answer ? 'success' : 'select');
  }

  function next() {
    if (index < questions.length - 1) { setIndex(index + 1); setChosen(null); return; }
    const current = readInquiry(id);
    saveInquiry(id, { ...current, challenge: { correct: score, total: questions.length, at: new Date().toISOString() } });
    setFinished(true);
  }

  if (finished) return <section className="discovery-screen extra-stage">
    <ScientistGuide>{score === questions.length ? '와, 모든 상황에 발견을 적용했어!' : '틀린 문제도 이유를 알았으니 이제 내 것이야!'}</ScientistGuide>
    <h1>도전 완료!</h1>
    <div className="challenge-score">{questions.map((item, i) => <span key={item.situation} className={firstTry[i] ? 'hit' : 'retry'}>{item.icon} {firstTry[i] ? '한 번에!' : '다시 생각해서 성공'}</span>)}</div>
    <p className="prediction-note">새로운 상황 {questions.length}개 중 <strong>{score}개</strong>를 한 번에 맞혔어.</p>
    <PrimaryButton tone={id} onClick={onDone}>별 받기</PrimaryButton>
  </section>;

  return <section className="prediction-screen extra-stage challenge-stage">
    <ScientistGuide>오늘 발견한 걸 생활 속 상황에 써 볼까? ({index + 1} / {questions.length})</ScientistGuide>
    <div className="challenge-card"><span className="challenge-icon" aria-hidden="true">{question.icon}</span><h1>{question.situation}</h1></div>
    <div className="choice-grid challenge-options">{shown.map((option) => {
      const state = chosen === option ? (option === answer ? 'right' : 'wrong') : '';
      return <button key={option} className={`${state} ${state ? 'selected' : ''}`} aria-pressed={chosen === option} disabled={correct && option !== answer} onClick={() => choose(option)}>{state === 'right' && <Check size={22} />}{option}</button>;
    })}</div>
    <div aria-live="polite">{chosen && (correct
      ? <p className="challenge-feedback right">맞았어! {question.explain}</p>
      : <p className="challenge-feedback wrong">음, 다시 생각해 볼까? 실험에서 본 결과를 떠올려 봐.</p>)}</div>
    <PrimaryButton tone={id} disabled={!correct} onClick={next}>{index < questions.length - 1 ? '다음 상황' : '도전 마치기'}</PrimaryButton>
  </section>;
}
