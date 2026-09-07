'use client';

import { ArrowLeft, Check, Download, FileText, FlaskConical, Printer, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/progress';
import { reportCatalog } from '@/lib/reportCatalog';
import { experimentIds, type ExperimentId, type ExperimentReport } from '@/types/experiment';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export default function ReportsPage() {
  const [id, setId] = useState<ExperimentId | null>(null);
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const candidate = new URLSearchParams(location.search).get('id') as ExperimentId | null;
    if (candidate && experimentIds.includes(candidate)) {
      setId(candidate);
      setReport(getProgress().records[candidate].report || null);
    }
    setReady(true);
  }, []);

  function downloadReport() {
    if (!report || !id) return;
    const catalog = reportCatalog[id];
    const text = [
      '콩콩 과학실험실 - 실험 활동 리포트',
      `실험: ${report.title}`,
      `완료: ${formatDate(report.completedAt)}`,
      `실험 질문: ${report.question}`,
      `아이의 예상: ${report.prediction}`,
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

  return <main className="report-page">
    <header className="report-toolbar">
      <a href="/discoveries"><ArrowLeft size={21} /> 발견 모아보기</a>
      <strong><FileText size={21} /> 학부모용 활동 리포트</strong>
      <div><button onClick={() => window.print()}><Printer size={20} /> 인쇄·PDF</button><button onClick={downloadReport}><Download size={20} /> 파일 받기</button></div>
    </header>
    <article className="parent-report">
      <div className="report-brand"><span className="brand-icon"><FlaskConical size={25} /></span><strong>콩콩 과학실험실</strong><span>초등 3학년 과학 탐구</span></div>
      <section className="report-title-block"><div>{catalog.icon}</div><div><p>EXPERIMENT REPORT</p><h1>{report.title} 활동 리포트</h1><span>끝까지 탐구했어요 <Star size={19} fill="currentColor" /></span></div></section>
      <div className="report-meta"><div><span>활동 완료</span><strong>{formatDate(report.completedAt)}</strong></div><div><span>다시 도전한 횟수</span><strong>{report.retryCount}회</strong></div><div><span>아이 이름</span><strong className="name-line">직접 적어 주세요</strong></div></div>
      <section className="report-section"><h2>탐구 과정</h2><div className="process-row">{['궁금한 점 확인', '결과 예상', '직접 조작·관찰', '과학 개념 발견'].map((item) => <div key={item}><Check size={20} /><span>{item}</span></div>)}</div></section>
      <section className="report-section report-question"><span>실험 질문</span><h2>{report.question}</h2><div><strong>아이의 예상</strong><p>{report.prediction}</p></div></section>
      <section className="report-section"><h2>관찰 기록</h2><ol>{report.observations.map((item) => <li key={item}><Check size={19} /><span>{item}</span></li>)}</ol></section>
      <section className="report-discovery"><span>이번 실험에서 발견한 과학 개념</span><strong>{report.discovery}</strong></section>
      <section className="report-section skill-section"><h2>연습한 탐구 능력</h2><div>{report.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
      <section className="parent-talk"><div>보호자와 함께 이야기해 보세요</div><p>{catalog.parentPrompt}</p><span>보호자 한마디</span><div className="comment-lines" /></section>
      <footer className="report-footer">이 리포트는 정답 점수가 아니라 아이가 실험 과정을 끝까지 수행한 기록입니다.</footer>
    </article>
  </main>;
}
