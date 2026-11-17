'use client';
import { useEffect, useState } from 'react';
import { experimentIds, type ExperimentId } from '@/types/experiment';
import { lessonAreas, lessonCatalog } from '@/lib/lessonCatalog';
import { reportCatalog } from '@/lib/reportCatalog';

export default function LessonsPage() {
  const [selected, setSelected] = useState<ExperimentId | null>(null);
  const [area, setArea] = useState('전체');
  const [worksheet, setWorksheet] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { const id = new URLSearchParams(location.search).get('id'); if (experimentIds.includes(id as ExperimentId)) setSelected(id as ExperimentId); }, []);
  const lesson = selected ? lessonCatalog[selected] : null;
  return <main className="lesson-page"><header className="lesson-header"><a href="/">🧪 콩콩 과학실험실</a><nav><a href="/classroom">수업 준비</a><a href="/discoveries">나의 발견</a></nav></header>
    <section className="lesson-hero"><p>TEACHER'S LAB</p><h1>18개의 실험,<br />수업으로 이어지는 발견</h1><p>실험별 진행안과 활동지를 준비했어요. 관찰한 근거로 이야기하는 탐구를 시작하세요.</p><small>초등 대상 체험 설계안입니다. 학년별 교육과정 적합성은 교사가 활동 수준에 맞춰 확인해 주세요.</small></section>
    <div className="lesson-layout"><aside className="lesson-sidebar"><label>주제별 찾기<select value={area} onChange={(e) => setArea(e.target.value)}>{['전체', ...lessonAreas].map((a) => <option key={a}>{a}</option>)}</select></label>{experimentIds.filter((id) => area === '전체' || lessonCatalog[id].area === area).map((id) => <button key={id} aria-pressed={selected === id} onClick={() => { setSelected(id); setWorksheet(false); history.replaceState(null, '', `/lessons?id=${id}`); }}>{reportCatalog[id].icon} {reportCatalog[id].title}<small>{lessonCatalog[id].minutes}분 · {lessonCatalog[id].area}</small></button>)}</aside>
    {lesson && selected ? <article className={`lesson-document ${worksheet ? 'worksheet-mode' : ''}`}><div className="lesson-actions"><button aria-pressed={!worksheet} onClick={() => setWorksheet(false)}>교사용 지도안</button><button aria-pressed={worksheet} onClick={() => setWorksheet(true)}>학생 활동지</button><button onClick={() => window.print()}>인쇄 / PDF 저장</button><a href={`/experiment/${selected}`}>실험 시작 ↗</a><button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/experiment/${selected}`); setMessage('실험 링크를 복사했어요.'); } catch { setMessage(`실험 주소: ${location.origin}/experiment/${selected}`); } }}>실험 링크 복사</button></div><p role="status">{message}</p>
      <p className="lesson-kicker">{lesson.area} · {lesson.concept}</p><h2>{reportCatalog[selected].icon} {reportCatalog[selected].title}</h2>
      {worksheet ? <><p>조 / 별명 ____________________ 날짜 ____________________</p>{['오늘의 질문', '내 예상과 이유', '바꿀 조건 / 같게 할 조건', '첫 번째 관찰', '조건을 바꾼 두 번째 관찰', '두 결과를 비교한 내 설명', '다음에 알아보고 싶은 질문'].map((label) => <section className="worksheet-line" key={label}><h3>{label}</h3><div /></section>)}<p>탐구 도움말: {lesson.observe}</p></> : <>
      <section><h3>학습 목표</h3><p>{lesson.objective}</p><div className="lesson-facts"><span>웹 활동 약 {lesson.minutes}분</span><span>수업 설계 40분 / 확장 60분</span><span>개별 또는 2인 1기기</span></div></section>
      <section><h3>준비와 수업 흐름</h3><p>인터넷 연결 기기, 화면 공유 장치, 인쇄 활동지와 필기구. 접속·소리·결과 저장을 사전에 확인하세요.</p><ol className="lesson-timeline"><li><strong>도입 · 5분</strong>질문을 읽고 예상과 이유를 말합니다.</li><li><strong>탐구 · 20분</strong>{lesson.observe} 짝 활동에서는 조작과 기록 역할을 바꿉니다.</li><li><strong>설명 · 10분</strong>두 결과를 비교하고 활동지에 근거를 남깁니다.</li><li><strong>정리 · 5분</strong>{lesson.question}</li></ol><p>60분 운영 시 반복 관찰 10분과 발표·확장 질문 10분을 추가합니다. 실제 속도에 맞춰 조정하세요.</p></section>
      <section><h3>공정하게 비교하기</h3><p><b>바꿀 조건:</b> {lesson.change}</p><p><b>같게 유지:</b> {lesson.keep}</p></section><section><h3>교사의 질문과 해설</h3><p>{lesson.question}</p><p><b>해설:</b> {lesson.answer}</p><p><b>오개념 살피기:</b> {lesson.misconception}</p></section>
      <section><h3>확장 탐구</h3><p>{lesson.challenge}</p><p><b>가정에서 이어가기:</b> {reportCatalog[selected].parentPrompt}</p></section><section><h3>관찰 체크</h3><p>□ 예상의 이유 말하기　□ 조건 구분하기　□ 결과 비교하기　□ 관찰을 근거로 설명하기</p><p>각 항목은 독립 수행 / 도움받아 수행 / 미관찰로 기록합니다. 완료 여부를 성취 점수로 바꾸지 않습니다.</p></section><aside className="lesson-note"><strong>모형을 설명할 때</strong><p>{lesson.limitation}</p></aside>
      </>}
    </article> : <article className="lesson-document lesson-empty"><span>📚</span><h2>오늘의 실험을 골라 주세요</h2><p>18개 실험 모두 지도안·인쇄 활동지·확장 질문이 준비되어 있어요.</p></article>}</div>
  </main>;
}
