'use client';

import { ArrowLeft, FileText, FlaskConical, RotateCcw, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, resetProgress } from '@/lib/progress';

const discoveries = [
  { id: 'force', number: '01', icon: '📦', title: '힘 연구소', text: '무거운 물체를 밀 때는 더 큰 힘이 필요할 수 있어요.', className: 'force' },
  { id: 'matter', number: '02', icon: '💧', title: '물질 연구소', text: '액체는 담는 그릇에 따라 모양이 달라질 수 있어요.', className: 'matter' },
  { id: 'sound', number: '03', icon: '🎸', title: '소리 연구소', text: '소리가 나는 물체에는 떨림이 있고, 높고 낮은 소리를 만들 수 있어요.', className: 'sound' },
  { id: 'magnet', number: '04', icon: '🧲', title: '자석 연구소', text: '자석은 철로 된 물체를 끌어당길 수 있어요.', className: 'magnet' },
  { id: 'light', number: '05', icon: '🔦', title: '빛 연구소', text: '빛과 물체 사이의 거리에 따라 그림자 크기가 달라져요.', className: 'light' },
  { id: 'air', number: '06', icon: '🫧', title: '공기 연구소', text: '눈에 잘 보이지 않는 공기도 자리를 차지해요.', className: 'air' },
  { id: 'heat', number: '07', icon: '🧊', title: '온도 연구소', text: '얼음은 더 따뜻한 곳에서 더 빨리 녹아요.', className: 'heat' },
  { id: 'plant', number: '08', icon: '🌱', title: '식물 연구소', text: '식물의 줄기는 물을 위쪽 잎까지 옮겨요.', className: 'plant' },
  { id: 'earth', number: '09', icon: '⛰️', title: '땅 연구소', text: '흐르는 물은 흙을 옮기며 땅의 모습을 바꿔요.', className: 'earth' },
  { id: 'float', number: '10', icon: '🛟', title: '뜨고 가라앉기 연구소', text: '물체가 물에 뜨거나 가라앉는 것은 재료와 무게, 모양에 따라 달라질 수 있어요.', className: 'float' },
  { id: 'dissolve', number: '11', icon: '🥄', title: '용해 연구소', text: '물질의 종류에 따라 물에 녹는 것도 있고 녹지 않는 것도 있어요.', className: 'dissolve' },
  { id: 'circuit', number: '12', icon: '💡', title: '전기 회로 연구소', text: '전구가 켜지려면 전기가 흐르는 길이 끊김없이 이어져야 해요.', className: 'circuit' },
  { id: 'seed', number: '13', icon: '🌰', title: '씨앗 연구소', text: '알맞은 물과 따뜻한 온도가 있을 때 씨앗이 싹텄어요. 공기의 영향은 따로 비교해 봐요.', className: 'seed' },
  { id: 'friction', number: '14', icon: '🛝', title: '마찰 연구소', text: '바닥 재료에 따라 마찰이 달라 자동차가 멈추는 거리가 달라져요.', className: 'friction' },
  { id: 'absorb', number: '15', icon: '🧽', title: '흡수 연구소', text: '재료마다 물을 흡수하는 정도가 달라요.', className: 'absorb' },
  { id: 'color', number: '16', icon: '🎨', title: '색 혼합 연구소', text: '물감 두 색을 섞으면 처음과 다른 새로운 색을 만들 수 있어요.', className: 'color' },
  { id: 'surface', number: '17', icon: '🫧', title: '표면 장력 연구소', text: '비누가 닿은 부분의 표면 장력이 작아지면 물이 흐르고, 그 흐름을 따라 후추가 움직여요.', className: 'surface' },
  { id: 'reaction', number: '18', icon: '🎈', title: '반응 연구소', text: '베이킹소다와 식초가 반응하면 이산화 탄소 기체가 생겨요.', className: 'reaction' },
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
    <header className="experiment-header"><a href="/" className="home-link"><ArrowLeft size={23} /><span>실험실로</span></a><div className="experiment-title"><FlaskConical size={22} />나의 발견</div><div className="compact-stars"><Star size={20} fill="currentColor" /> {completed.length} / {discoveries.length}</div></header>
    <section className="stickerbook">
      <div className="sticker-title"><span>🎉 🔬 ⭐</span><h1>{completed.length === discoveries.length ? '오늘의 꼬마 과학자!' : '나의 과학 스티커북'}</h1><p>{completed.length === discoveries.length ? `${discoveries.length}개의 실험을 모두 완료했어요!` : '실험하면 발견 스티커가 열려요.'}</p>{completed.length === discoveries.length && <strong>🏅 꼬마 과학자</strong>}</div>
      <div className="discovery-cards">
        {discoveries.map((item) => {
          const unlocked = completed.includes(item.id);
          return <article className={`discovery-card ${item.className} ${unlocked ? '' : 'locked'}`} key={item.id}><span className="discovery-number">{item.number}</span><div className="discovery-icon">{unlocked ? item.icon : '🔒'}</div><h2>{unlocked ? item.title : '아직 비밀이에요'}</h2><p>{unlocked ? item.text : '실험을 마치면 발견할 수 있어!'}</p>{unlocked && <div className="discovery-card-actions"><span>★ 발견 완료</span><a href={`/reports?id=${item.id}`}><FileText size={17} /> 리포트 보기</a></div>}</article>;
        })}
      </div>
      <div className="sticker-actions"><a href="/"><ArrowLeft size={22} /> 다른 실험 하기</a>{completed.length > 0 && <button onClick={restart}><RotateCcw size={22} /> 다시 실험하기</button>}</div>
    </section>
  </main>;
}
