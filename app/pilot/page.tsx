'use client';

import { useEffect, useState } from 'react';
import { experimentIds } from '@/types/experiment';
import { reportCatalog } from '@/lib/reportCatalog';

const STORAGE_KEY = 'kongkongPilotSurvey';

const quickStart = [
  { title: '실험 고르기', text: '홈의 “실험 찾기”에서 주제나 단어로 검색하고, 카드의 “지도안 · 활동지”를 먼저 열어 보세요.', href: '/lessons' },
  { title: '콩콩이 설명 켜기', text: '실험 화면 위쪽 “❔ 콩콩이 설명”을 누르면 콩콩이가 화면 구성과 진행 순서를 학생에게 안내합니다.', href: '/experiment/magnet' },
  { title: '교실 화면 맞추기', text: 'TV·전자칠판에서는 “큰 화면”, 소리는 🔊 버튼으로 조절합니다. 학생 기기에서는 소리를 꺼도 됩니다.', href: '/experiment/magnet' },
  { title: '탐구 노트로 기록', text: '학생이 조작한 조건과 결과가 자동으로 쌓입니다. 예상의 이유와 설명은 학생이 직접 적게 해 주세요.', href: '/classroom' },
  { title: '리포트로 마무리', text: '실험을 마치면 보호자용 리포트가 생깁니다. 인쇄하거나 PDF로 저장해 보낼 수 있습니다.', href: '/discoveries' },
];

const checklist = {
  before: ['접속 주소와 와이파이 확인', '학생 기기 수와 화면(TV·칠판) 연결 확인', '오늘 진행할 실험 1~2개 미리 해 보기', '활동지 인쇄', '조 편성과 조 이름 정하기'],
  during: ['콩콩이 설명으로 화면 구성 안내 (3분)', '예상과 그 이유를 먼저 말하게 하기', '조작 역할과 기록 역할 바꾸기', '막히는 학생 · 오류 화면 메모'],
  after: ['조별 기록 파일 받기 (수업 준비 페이지)', '학생 반응 관찰표 정리', '교사 평가 설문 작성', '보호자 리포트 전달 여부 결정'],
};

const ratings = [
  ['prep', '수업 준비 시간을 줄여 주었다'],
  ['engage', '학생들이 적극적으로 참여했다'],
  ['understand', '개념 이해에 도움이 되었다'],
  ['usable', '학생이 혼자서도 조작할 수 있었다'],
  ['report', '탐구 노트·리포트가 쓸모 있었다'],
  ['reuse', '다음 수업에도 쓰고 싶다'],
] as const;

type Survey = {
  org: string; orgType: string; grade: string; students: string; experiments: string[];
  scores: Record<string, number>; buy: string; price: string; good: string; bad: string; need: string;
  checks: string[]; savedAt?: string;
};

const blank = (): Survey => ({ org: '', orgType: '', grade: '', students: '', experiments: [], scores: {}, buy: '', price: '', good: '', bad: '', need: '', checks: [] });

export default function PilotPage() {
  const [survey, setSurvey] = useState<Survey>(blank);
  const [status, setStatus] = useState('');

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (saved && typeof saved === 'object') setSurvey({ ...blank(), ...saved }); } catch { /* Start blank. */ }
  }, []);

  function update<K extends keyof Survey>(key: K, value: Survey[K]) {
    setSurvey((old) => ({ ...old, [key]: value }));
    setStatus('아직 저장하지 않은 내용이 있어요.');
  }

  function save() {
    const next = { ...survey, savedAt: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSurvey(next); setStatus('이 기기에 저장했어요.'); return next; }
    catch { setStatus('저장 공간을 쓸 수 없어요. 파일로 받아 주세요.'); return next; }
  }

  function download() {
    const value = save();
    const lines = [
      '콩콩 과학실험실 파일럿 수업 평가',
      `기관: ${value.org || '미입력'} (${value.orgType || '유형 미입력'})`,
      `학년 · 인원: ${value.grade || '-'} · ${value.students || '-'}명`,
      `사용한 실험: ${value.experiments.map((id) => reportCatalog[id as keyof typeof reportCatalog]?.title ?? id).join(', ') || '-'}`,
      '',
      ...ratings.map(([key, label]) => `${label}: ${value.scores[key] ?? '-'} / 5`),
      '',
      `유료 이용 의향: ${value.buy || '-'}`,
      `적정하다고 생각하는 가격: ${value.price || '-'}`,
      `좋았던 점: ${value.good || '-'}`,
      `불편했던 점: ${value.bad || '-'}`,
      `있으면 좋겠는 기능·자료: ${value.need || '-'}`,
      `작성: ${value.savedAt}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([lines], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `콩콩-파일럿평가-${(value.org || '기관').replace(/\s+/g, '')}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('저장하고 파일을 만들었어요.');
  }

  function toggleCheck(item: string) {
    update('checks', survey.checks.includes(item) ? survey.checks.filter((value) => value !== item) : [...survey.checks, item]);
  }

  return <main className="lesson-page pilot-page">
    <header className="lesson-header"><a href="/">🧪 콩콩 과학실험실</a><nav><a href="/lessons">지도안 · 활동지</a><a href="/classroom">수업 준비</a><a href="/business">기관 도입</a></nav></header>
    <section className="lesson-hero"><p>PILOT KIT</p><h1>처음 쓰는 선생님을 위한<br />파일럿 수업 키트</h1><p>5분 사용 안내, 수업 전·중·후 체크리스트, 수업 뒤 평가 설문을 한곳에 모았어요.</p><small>설문 내용은 이 기기에만 저장됩니다. 파일로 받아 콩콩 운영팀에 전달해 주세요.</small></section>

    <section className="classroom-panel"><h2>1. 5분 사용 안내</h2><ol className="pilot-steps">{quickStart.map((item, index) => <li key={item.title}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.text}</p></div><a href={item.href}>열어 보기 →</a></li>)}</ol></section>

    <section className="classroom-panel"><h2>2. 운영 체크리스트</h2><div className="pilot-checks">{(Object.entries(checklist) as [keyof typeof checklist, string[]][]).map(([phase, items]) => <div key={phase}><h3>{phase === 'before' ? '수업 전' : phase === 'during' ? '수업 중' : '수업 후'}</h3>{items.map((item) => <label key={item}><input type="checkbox" checked={survey.checks.includes(item)} onChange={() => toggleCheck(item)} />{item}</label>)}</div>)}</div></section>

    <section className="classroom-panel pilot-survey"><h2>3. 수업 뒤 교사 평가</h2>
      <div className="pilot-fields">
        <label>기관 이름<input value={survey.org} onChange={(e) => update('org', e.target.value)} maxLength={60} /></label>
        <label>기관 유형<select value={survey.orgType} onChange={(e) => update('orgType', e.target.value)}><option value="">선택</option>{['초등학교', '늘봄·방과후', '학원', '지역아동센터·돌봄', '도서관·청소년기관', '기타'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>학년<input value={survey.grade} onChange={(e) => update('grade', e.target.value)} maxLength={20} placeholder="예: 3학년" /></label>
        <label>참여 학생 수<input inputMode="numeric" value={survey.students} onChange={(e) => update('students', e.target.value.replace(/[^0-9]/g, ''))} maxLength={4} /></label>
      </div>
      <fieldset className="pilot-experiments"><legend>사용한 실험</legend>{experimentIds.map((id) => <label key={id}><input type="checkbox" checked={survey.experiments.includes(id)} onChange={() => update('experiments', survey.experiments.includes(id) ? survey.experiments.filter((value) => value !== id) : [...survey.experiments, id])} />{reportCatalog[id].icon} {reportCatalog[id].title}</label>)}</fieldset>
      <div className="pilot-ratings">{ratings.map(([key, label]) => <fieldset key={key}><legend>{label}</legend>{[1, 2, 3, 4, 5].map((score) => <label key={score}><input type="radio" name={key} checked={survey.scores[key] === score} onChange={() => update('scores', { ...survey.scores, [key]: score })} />{score}</label>)}</fieldset>)}<small>1 = 전혀 아니다 · 5 = 매우 그렇다</small></div>
      <fieldset className="pilot-buy"><legend>유료로 계속 이용할 의향이 있나요?</legend>{['있다', '조건이 맞으면 있다', '아직 없다'].map((item) => <label key={item}><input type="radio" name="buy" checked={survey.buy === item} onChange={() => update('buy', item)} />{item}</label>)}</fieldset>
      <div className="pilot-fields wide">
        <label>적정하다고 생각하는 가격과 단위 (예: 학급당 학기 OO원)<input value={survey.price} onChange={(e) => update('price', e.target.value)} maxLength={100} /></label>
        <label>좋았던 점<textarea rows={3} value={survey.good} onChange={(e) => update('good', e.target.value)} maxLength={1000} /></label>
        <label>불편했던 점 · 오류<textarea rows={3} value={survey.bad} onChange={(e) => update('bad', e.target.value)} maxLength={1000} /></label>
        <label>있으면 좋겠는 기능 · 자료<textarea rows={3} value={survey.need} onChange={(e) => update('need', e.target.value)} maxLength={1000} /></label>
      </div>
      <div className="lesson-actions"><button onClick={save}>저장</button><button onClick={download}>저장하고 파일 받기</button><button onClick={() => window.print()}>인쇄</button></div><p role="status">{status}</p>
    </section>

    <section className="classroom-panel pilot-observe"><h2>4. 학생 반응 관찰표 (인쇄용)</h2><table className="magnet-table"><thead><tr><th>조</th><th>예상의 이유를 말함</th><th>조건을 바꿔 비교함</th><th>결과로 설명함</th><th>도움이 필요했던 순간</th></tr></thead><tbody>{[1, 2, 3, 4, 5, 6].map((group) => <tr key={group}><th scope="row">{group}조</th><td>□</td><td>□</td><td>□</td><td /></tr>)}</tbody></table></section>
  </main>;
}
