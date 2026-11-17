'use client';
import { useEffect, useState } from 'react';
import { experimentIds, type ExperimentId } from '@/types/experiment';
import { reportCatalog } from '@/lib/reportCatalog';
import { lessonCatalog } from '@/lib/lessonCatalog';
import { readInquiry, emptyInquiry, saveInquiry } from '@/lib/inquiry';

export default function Classroom() {
  const [selected, setSelected] = useState<ExperimentId[]>([]);
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('classroom-plan') || '[]'); if (Array.isArray(saved)) setSelected(saved.filter((id: ExperimentId) => experimentIds.includes(id))); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem('classroom-plan', JSON.stringify(selected)); } catch { setStatus('수업 선택을 저장할 수 없습니다.'); } } }, [selected, ready]);
  function backup() {
    const records = Object.fromEntries(experimentIds.map((id) => [id, readInquiry(id)]));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `콩콩-탐구기록-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus('이 기기의 18개 탐구 기록을 파일로 내보냈습니다.');
  }
  function newGroup() {
    if (!group.trim() || !selected.length) return;
    if (!window.confirm('선택한 실험의 기존 기록을 이 기기에 보관하고 새 조의 탐구 노트를 시작할까요? 기존 기록은 보관 기록 파일로 받을 수 있습니다.')) return;
    try {
      const previous = JSON.parse(localStorage.getItem('inquiry-archive') || '[]');
      const archive = { at: new Date().toISOString(), records: Object.fromEntries(selected.map((id) => [id, readInquiry(id)])) };
      localStorage.setItem('inquiry-archive', JSON.stringify([...previous, archive]));
      const ok = selected.map((id) => saveInquiry(id, { ...emptyInquiry(), group: group.trim() }));
      setStatus(ok.every(Boolean) ? `${group.trim()}의 새 노트가 준비됐어요. 기존 기록은 보관했습니다.` : '일부 기록을 저장하지 못했습니다. 저장 공간을 확인하세요.');
    } catch { setStatus('기록을 보관하지 못해 새 조를 시작하지 않았습니다. 파일을 먼저 받아 주세요.'); }
  }
  function archiveDownload() {
    const text = localStorage.getItem('inquiry-archive') || '[]'; const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = '콩콩-이전조-보관기록.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="lesson-page"><header className="lesson-header"><a href="/">🧪 콩콩 과학실험실</a><nav className="lesson-header-links"><a href="/lessons">전체 지도안 · 활동지</a><a href="/pilot">파일럿 수업 키트</a></nav></header><section className="lesson-hero"><p>CLASSROOM</p><h1>오늘의 탐구 수업</h1><p>진행할 순서대로 실험을 고르세요. 한 기기를 함께 쓰면 조별로 기록해요.</p></section>
    <section className="classroom-panel"><h2>1. 실험 선택 <small>{selected.length}개</small></h2><div className="classroom-picker">{experimentIds.map((id) => <button key={id} aria-pressed={selected.includes(id)} onClick={() => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])}>{reportCatalog[id].icon} {reportCatalog[id].title}</button>)}</div></section>
    <section className="classroom-panel"><h2>2. 수업 순서</h2>{selected.length ? <ol className="classroom-sequence">{selected.map((id, index) => <li key={id}><span>{index + 1}</span><div><strong>{reportCatalog[id].title}</strong><p>{lessonCatalog[id].concept} · 웹 활동 약 {lessonCatalog[id].minutes}분</p></div><a href={`/lessons?id=${id}`}>자료</a><a href={`/experiment/${id}`}>시작 →</a></li>)}</ol> : <p>위에서 첫 번째 실험을 골라 주세요.</p>}</section>
    <section className="classroom-panel"><h2>3. 조별 노트와 기록 보관</h2><p>현재 기기의 기록만 관리합니다. 다른 기기의 결과는 각 기기에서 파일로 받아 취합해 주세요.</p><label className="classroom-group">새 조 번호 또는 별명<input value={group} onChange={(e) => setGroup(e.target.value)} maxLength={40} placeholder="예: 2조 별빛 연구원" /></label><div className="lesson-actions"><button onClick={backup}>현재 기록 파일 받기</button><button disabled={!group.trim() || !selected.length} onClick={newGroup}>기록 보관 후 새 조 시작</button><button onClick={archiveDownload}>이전 조 보관 기록 받기</button></div><p role="status">{status}</p></section>
    <aside className="lesson-note">수업 전: 링크 접속 → 기기 조작 확인 → 소리·화면 확인 → 활동지 준비. 조별 노트와 별·완료 표시는 별개이며 기존 실험 완료 표시는 유지됩니다.</aside>
  </main>;
}
