'use client';

import { useState } from 'react';

const packages = [
  {
    tag: '첫 상담',
    title: '20분 온라인 데모',
    price: '무료',
    description: '담당 교사가 직접 화면을 보고 수업 적용 가능성을 판단합니다.',
    items: ['대표 실험 2개 시연', '지도안·활동지 확인', '학급 환경에 맞춘 도입 상담'],
    featured: false,
  },
  {
    tag: '첫 매출 상품',
    title: '1회 유료 시범수업',
    price: '33만원',
    description: '한 학급에서 실제로 사용하고 학생·교사 의견까지 정리합니다.',
    items: ['50분 수업 1회', '18개 가상실험 30일 이용', '교사용 지도안·학생 활동지', '도입 결과 1쪽 요약'],
    featured: true,
  },
  {
    tag: '반복 운영',
    title: '4주 탐구 프로그램',
    price: '99만원',
    description: '학교·학원·돌봄기관에서 네 차시를 연속 운영하는 패키지입니다.',
    items: ['주 1회 × 4차시', '주제별 실험 구성', '조별 탐구 기록', '교사 운영 안내 1회'],
    featured: false,
  },
] as const;

const inquiryTemplate = `콩콩 과학실험실 도입 상담을 요청합니다.

기관명:
지역:
담당자명:
연락 가능한 이메일 또는 전화:
관심 상품: 20분 온라인 데모 / 1회 유료 시범수업 / 4주 탐구 프로그램
예상 학생 수:
희망 일정:
문의 내용:`;

export default function BusinessPage() {
  const [status, setStatus] = useState('');

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(inquiryTemplate);
      setStatus('상담 요청 문안을 복사했습니다. 사용하실 이메일·문자·메신저에 붙여 넣어 주세요.');
    } catch {
      setStatus('복사할 수 없습니다. 아래 문안을 직접 선택해 복사해 주세요.');
    }
  }

  return <main className="business-page">
    <header className="business-header"><a href="/">🧪 콩콩 과학실험실</a><nav><a href="/lessons">수업자료</a><a href="/classroom">수업 준비</a><a href="/pilot">파일럿 키트</a></nav></header>

    <section className="business-hero">
      <div><p>FOR SCHOOL · ACADEMY · PUBLIC EDUCATION</p><h1>한 학급에서 먼저<br />검증해 보세요.</h1><span>18개 가상실험과 지도안·활동지·탐구 기록을 한 번의 수업 흐름으로 제공합니다.</span><a href="#packages">도입 상품 보기 ↓</a></div>
      <div className="business-proof"><strong>현재 제공</strong><span>18개 가상실험</span><span>교사용 지도안</span><span>학생 활동지</span><span>조별 탐구 노트</span><span>활동 리포트</span></div>
    </section>

    <section className="business-section"><p className="business-kicker">WHY KONGKONG</p><h2>무료 실험 사이트와 다른 판매 포인트</h2><div className="business-value-grid">
      <article><strong>01</strong><h3>수업 전체 흐름</h3><p>실험 화면만 제공하지 않고 예상·관찰·설명·확장 질문까지 연결합니다.</p></article>
      <article><strong>02</strong><h3>교사의 준비 시간 절감</h3><p>실험별 목표, 조건, 오개념, 활동지를 한 화면에서 바로 확인합니다.</p></article>
      <article><strong>03</strong><h3>학생의 탐구 기록</h3><p>학생이 조작한 조건과 결과를 남기고 자신의 설명을 작성할 수 있습니다.</p></article>
    </div></section>

    <section className="business-section business-packages" id="packages"><p className="business-kicker">PAID PILOT</p><h2>처음에는 작게 판매합니다</h2><p className="business-lead">현재 단계에서는 연간 라이선스보다 유료 시범수업으로 만족도와 재구매 의사를 확인합니다.</p><div className="package-grid">{packages.map((item) => <article key={item.title} className={item.featured ? 'featured' : ''}><span>{item.tag}</span><h3>{item.title}</h3><strong>{item.price}<small>{item.price !== '무료' ? ' · 부가세 별도' : ''}</small></strong><p>{item.description}</p><ul>{item.items.map((detail) => <li key={detail}>✓ {detail}</li>)}</ul><a href="#inquiry">이 상품으로 상담 준비</a></article>)}</div><p className="business-fineprint">현장 이동비와 재료비는 지역·수업 구성에 따라 별도 협의합니다. 표시된 가격은 초기 시범 운영 가격입니다.</p></section>

    <section className="business-section business-roadmap"><p className="business-kicker">ADOPTION FLOW</p><h2>기관 도입 순서</h2><ol><li><span>1</span><div><strong>20분 데모</strong><p>담당 교사가 대표 실험과 자료를 확인합니다.</p></div></li><li><span>2</span><div><strong>한 학급 유료 시범</strong><p>학생 반응과 교사 사용성을 실제 수업에서 확인합니다.</p></div></li><li><span>3</span><div><strong>4주 프로그램</strong><p>반복 사용과 학부모·학생 만족도를 확인합니다.</p></div></li><li><span>4</span><div><strong>학기·연간 라이선스</strong><p>시범 결과를 바탕으로 기관별 이용 범위와 가격을 확정합니다.</p></div></li></ol></section>

    <section className="business-inquiry" id="inquiry"><div><p className="business-kicker">START A PILOT</p><h2>도입 상담 문안을 준비하세요</h2><p>사업용 이메일이나 전화번호가 확정되면 이 페이지의 상담 버튼에 연결할 수 있습니다.</p><button onClick={copyInquiry}>상담 요청 문안 복사</button><p role="status">{status}</p></div><pre>{inquiryTemplate}</pre></section>

    <footer className="business-footer"><strong>콩콩 과학실험실</strong><span>초등 탐구 수업을 위한 가상 과학실험 패키지</span></footer>
  </main>;
}
