'use client';

import { ArrowLeft, FlaskConical, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProgress, resetProgress } from '@/lib/progress';

const discoveries = [
  { id: 'force', number: '01', icon: '📦', title: '힘 연구소', text: '무거운 물체를 밀 때는 더 큰 힘이 필요할 수 있어요.', className: 'force' },
  { id: 'matter', number: '02', icon: '💧', title: '물질 연구소', text: '액체는 담는 그릇에 따라 모양이 달라질 수 있어요.', className: 'matter' },
  { id: 'sound', number: '03', icon: '🎸', title: '소리 연구소', text: '소리가 나는 물체에는 떨림이 있고, 높고 낮은 소리를 만들 수 있어요.', className: 'sound' },
] as const;

export default function Discoveries() {
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    const progress = getProgress();
    setCompleted(discoveries.filter((item) => progress[`${item.id}Completed`]).map((item) => item.id));
  }, []);

  function restart() {
    resetProgress();
    location.href = '/';
  }

  return <main className="discoveries-page">
    <header className="experiment-header"><Link href="/" className="home-link"><ArrowLeft size={23} /><span>실험실로</span></Link><div className="experiment-title"><FlaskConical size={22} />나의 발견</div><div className="compact-stars"><Star size={20} fill="currentColor" /> {completed.length} / 3</div></header>
    <section className="stickerbook">
      <div className="sticker-title"><span>🎉 🔬 ⭐</span><h1>{completed.length === 3 ? '오늘의 꼬마 과학자!' : '나의 과학 스티커북'}</h1><p>{completed.length === 3 ? '3개의 실험을 모두 완료했어요!' : '실험하면 발견 스티커가 열려요.'}</p>{completed.length === 3 && <strong>🏅 꼬마 과학자</strong>}</div>
      <div className="discovery-cards">
        {discoveries.map((item) => {
          const unlocked = completed.includes(item.id);
          return <article className={`discovery-card ${item.className} ${unlocked ? '' : 'locked'}`} key={item.id}><span className="discovery-number">{item.number}</span><div className="discovery-icon">{unlocked ? item.icon : '🔒'}</div><h2>{unlocked ? item.title : '아직 비밀이에요'}</h2><p>{unlocked ? item.text : '실험을 마치면 발견할 수 있어!'}</p>{unlocked && <span className="sticker-star">★ 발견 완료</span>}</article>;
        })}
      </div>
      <div className="sticker-actions"><Link href="/"><ArrowLeft size={22} /> 다른 실험 하기</Link>{completed.length > 0 && <button onClick={restart}><RotateCcw size={22} /> 다시 실험하기</button>}</div>
    </section>
  </main>;
}
