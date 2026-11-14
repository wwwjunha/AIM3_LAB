'use client';
import { useEffect, useState } from 'react';
import type { ExperimentId } from '@/types/experiment';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { reportCatalog } from '@/lib/reportCatalog';
import { emptyInquiry, readInquiry, saveInquiry, downloadInquiry, type Inquiry } from '@/lib/inquiry';

export function InquiryNotebook({ id }: { id: ExperimentId }) {
  const [draft, setDraft] = useState<Inquiry>(emptyInquiry);
  const [status, setStatus] = useState('');
  const [choice, setChoice] = useState('');
  const lesson = lessonCatalog[id];
  useEffect(() => { setDraft(readInquiry(id)); const refresh = () => setDraft((old) => ({ ...old, trials: readInquiry(id).trials })); window.addEventListener('inquiry-updated', refresh); return () => window.removeEventListener('inquiry-updated', refresh); }, [id]);
  const fields = [['group', '조 번호 또는 별명', '이름 대신 1조, 별빛 연구원처럼 적어도 좋아요.'], ['reason', '처음 그렇게 예상한 이유', '내가 알고 있던 것과 연결해 봐요.'], ['changed', '내가 바꾼 조건', lesson.change], ['kept', '같게 유지한 조건', lesson.keep], ['observation', '직접 관찰한 결과', lesson.observe], ['explanation', '관찰을 근거로 한 내 설명', '어떤 결과를 보고 그렇게 생각했나요?'], ['nextQuestion', '다음에 알아보고 싶은 것', lesson.challenge]] as const;
  function save() { const next = { ...draft, trials: readInquiry(id).trials, savedAt: new Date().toISOString() }; setDraft(next); setStatus(saveInquiry(id, next) ? '이 기기에 저장했어요.' : '저장 공간을 사용할 수 없어요. 입력 내용을 복사해 주세요.'); }
  return <details className="inquiry-panel"><summary>📓 내 탐구 노트 <span>예상 · 비교 · 설명</span></summary><div className="inquiry-body">
    <p>노트를 작성한 뒤 저장해 주세요. 기록은 이 기기의 브라우저에 남아요.</p>
    <div className="inquiry-fields">{fields.map(([key, label, hint]) => <label key={key}>{label}<textarea maxLength={1000} rows={key === 'group' ? 1 : 2} value={draft[key]} placeholder={hint} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setStatus('아직 저장하지 않은 내용이 있어요.'); }} /></label>)}</div>
    <h3>화면에서 시험한 기록 <small>{draft.trials.length}회</small></h3>
    {draft.trials.length ? <ol className="trial-log">{draft.trials.map((trial, index) => <li key={`${trial.at}-${index}`}><strong>{trial.condition}</strong><span>{trial.result}</span></li>)}</ol> : <p>실험 화면에서 조작하면 조건과 결과가 여기에 쌓여요.</p>}
    <div className="lesson-quiz"><h3>생각 확인 · {lesson.question}</h3>{[lesson.distractor, lesson.answer].map((answer) => <button key={answer} aria-pressed={choice === answer} onClick={() => setChoice(answer)}>{answer}</button>)}{choice && <p role="status">{choice === lesson.answer ? '좋아요! 내 관찰 결과로도 설명해 보세요.' : `다시 생각해 볼까요? ${lesson.misconception}`}</p>}</div>
    <div className="lesson-actions"><button onClick={save}>노트 저장</button><button onClick={() => { const next = { ...draft, trials: readInquiry(id).trials, savedAt: new Date().toISOString() }; if (saveInquiry(id, next)) { downloadInquiry(id, reportCatalog[id].title); setStatus('저장하고 파일을 만들었어요.'); } else setStatus('저장할 수 없어요. 내용을 복사해 주세요.'); }}>저장하고 파일 받기</button></div><p role="status">{status}</p>
  </div></details>;
}
