'use client';

import { ArrowLeft, Check, Download, FileText, FlaskConical, Printer, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/progress';
import { reportCatalog } from '@/lib/reportCatalog';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { readInquiry, type Inquiry } from '@/lib/inquiry';
import { buildParentInsights } from '@/lib/parentInsights';

const NAME_KEY = 'kongkongChildName';
import { experimentIds, type ExperimentId, type ExperimentReport } from '@/types/experiment';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export default function ReportsPage() {
  const [id, setId] = useState<ExperimentId | null>(null);
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [ready, setReady] = useState(false);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [childName, setChildName] = useState('');

  useEffect(() => {
    const candidate = new URLSearchParams(location.search).get('id') as ExperimentId | null;
    if (candidate && experimentIds.includes(candidate)) {
      setId(candidate);
      setReport(getProgress().records[candidate].report || null);
      setInquiry(readInquiry(candidate));
    }
    try { setChildName(localStorage.getItem(NAME_KEY) || ''); } catch { /* Name stays blank without storage. */ }
    setReady(true);
  }, []);

  function updateName(value: string) {
    setChildName(value);
    try { localStorage.setItem(NAME_KEY, value); } catch { /* Still shown for printing. */ }
  }

  function downloadReport() {
    if (!report || !id) return;
    const catalog = reportCatalog[id];
    const insights = buildParentInsights(report, inquiry, lessonCatalog[id], childName);
    const text = [
      '콩콩 과학실험실 - 실험 활동 리포트',
      `실험: ${report.title}`,
      `완료: ${formatDate(report.completedAt)}`,
      `실험 질문: ${report.question}`,
      `아이 이름: ${childName.trim() || '미입력'}`,
      `아이의 예상: ${report.prediction}`,
      '',
      `오늘의 활동: ${insights.summary}`,
      '잘한 점',
      ...insights.strengths.map((item) => `- ${item}`),
      '가정에서 이어가기',
      ...insights.nextSteps.map((item) => `- ${item}`),
      `함께 확인해 볼 점: ${insights.checkPoint}`,
      `다음에 도전해 볼 질문: ${insights.challenge}`,
      '',
      `조 / 별명: ${inquiry?.group || '미입력'}`,
      `내 설명: ${inquiry?.explanation || '미작성'}`,
      '실제 화면 조작 기록',
      ...insights.trials.map((trial) => `${trial.condition}: ${trial.result}`),
      '',
      '관찰 기록',
      ...report.observations.map((item, index) => `${index + 1}. ${item}`),
      '',
      `발견한 과학 개념: ${report.discovery}`,
      `연습한 탐구 능력: ${report.skills.join(', ')}`,
      `보호자 대화 질문: ${catalog.parentPrompt}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `콩콩과학실험-${report.title}-리포트.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) return <main className="report-page" />;
  if (!id) return <main className="report-page"><section className="report-empty"><FileText size={56} /><h1>리포트를 찾을 수 없어요</h1><a href="/"><ArrowLeft size={20} /> 실험실로 돌아가기</a></section></main>;

  const catalog = reportCatalog[id];
  if (!report) return <main className="report-page"><section className="report-empty"><span>{catalog.icon}</span><h1>{catalog.title} 리포트</h1><p>이 실험을 다시 완료하면 자세한 활동 리포트가 만들어져요.</p><a href={`/experiment/${id}`}><FlaskConical size={20} /> 실험하러 가기</a></section></main>;

  const insights = buildParentInsights(report, inquiry, lessonCatalog[id], childName);

  return <main className="report-page">
    <header className="report-toolbar">
      <a href="/discoveries"><ArrowLeft size={21} /> 발견 모아보기</a>
      <strong><FileText size={21} /> 학부모용 활동 리포트</strong>
      <div><button onClick={() => window.print()}><Printer size={20} /> 인쇄·PDF</button><button onClick={downloadReport}><Download size={20} /> 파일 받기</button></div>
    </header>
    <article className="parent-report">
      <div className="report-brand"><span className="brand-icon"><FlaskConical size={25} /></span><strong>콩콩 과학실험실</strong><span>{lessonCatalog[id].area} · 탐구 활동</span></div>
      <section className="report-title-block"><div>{catalog.icon}</div><div><p>EXPERIMENT REPORT</p><h1>{report.title} 활동 리포트</h1><span>끝까지 탐구했어요 <Star size={19} fill="currentColor" /></span></div></section>
      <div className="report-meta"><div><span>활동 완료</span><strong>{formatDate(report.completedAt)}</strong></div><div><span>다시 도전한 횟수</span><strong>{report.retryCount}회</strong></div><div><span>아이 이름</span><label className="name-field"><span className="sr-only">아이 이름</span><input value={childName} maxLength={20} placeholder="이름을 적어 주세요" onChange={(event) => updateName(event.target.value)} /></label></div></div>
      <section className="report-section"><h2>탐구 과정</h2><div className="process-row">{['궁금한 점 확인', '결과 예상', '직접 조작·관찰', '과학 개념 발견'].map((item) => <div key={item}><Check size={20} /><span>{item}</span></div>)}</div></section>
      <section className="report-section report-question"><span>실험 질문</span><h2>{report.question}</h2><div><strong>아이의 예상</strong><p>{report.prediction}</p></div></section>
      <section className="report-section report-personal"><h2>{childName.trim() ? `${childName.trim()}의 오늘 탐구` : '오늘의 탐구 이야기'}</h2><p className="report-summary">{insights.summary}</p>
        <div className="insight-grid">
          <div className="insight-card good"><h3>이렇게 탐구했어요</h3><ul>{insights.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="insight-card next"><h3>가정에서 이렇게 이어가 주세요</h3><ul>{insights.nextSteps.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div className="insight-check"><strong>함께 확인해 볼 점</strong><p>{insights.checkPoint}</p><strong>다음에 도전해 볼 질문</strong><p>{insights.challenge}</p></div>
        <small className="insight-note">아이의 실제 조작 기록과 탐구 노트를 바탕으로 정리했어요. 능력을 평가한 점수나 진단이 아니에요. 이름은 이 기기에만 저장돼요.</small>
      </section>
      <section className="report-section"><h2>활동 내용 요약</h2><p>실험의 기본 해설과 활동 요약입니다.</p><ol>{report.observations.map((item) => <li key={item}><Check size={19} /><span>{item}</span></li>)}</ol></section>
      <section className="report-section"><h2>실제 화면 조작 기록</h2>{insights.trials.length ? <ol>{insights.trials.map((trial, i) => <li key={i}>{trial.condition} → {trial.result}</li>)}</ol> : <p>이전 활동에는 상세 조작 기록이 없어요. 다시 실험하면 기록됩니다.</p>}</section>
      <section className="report-section"><h2>학생이 작성한 탐구 노트</h2><p>조 / 별명: {inquiry?.group || '미입력'}</p><p>예상한 이유: {inquiry?.reason || '미작성'}</p><p>바꾼 조건: {inquiry?.changed || '미작성'}</p><p>같게 한 조건: {inquiry?.kept || '미작성'}</p><p>내 관찰: {inquiry?.observation || '미작성'}</p><p>내 설명: {inquiry?.explanation || '미작성'}</p><p>다음 질문: {inquiry?.nextQuestion || '미작성'}</p><a href={`/experiment/${id}`}>탐구 노트 보완하기</a></section>
      <section className="report-discovery"><span>이번 실험에서 발견한 과학 개념</span><strong>{report.discovery}</strong></section>
      <section className="report-section skill-section"><h2>연습한 탐구 능력</h2><div>{report.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
      <section className="parent-talk"><div>보호자와 함께 이야기해 보세요</div><p>{catalog.parentPrompt}</p><span>보호자 한마디</span><div className="comment-lines" /></section>
      <footer className="report-footer">이 리포트는 정답 점수가 아니라 아이가 실험 과정을 끝까지 수행한 기록입니다.</footer>
    </article>
  </main>;
}
