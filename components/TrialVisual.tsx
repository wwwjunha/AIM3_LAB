import type { ExtraExperimentConfig, ExtraTrial } from '@/lib/extraExperiments';

// Qualitative diagrams: positions illustrate the selected condition, not measurements.
export function TrialVisual({ experiment, trial }: { experiment: ExtraExperimentConfig['id']; trial: ExtraTrial }) {
  const id = trial.id;
  const stroke = '#23435b';
  let scene: React.ReactNode;
  if (experiment === 'float') {
    const floating = id === 'cork' || id === 'cap';
    scene = <><path d="M65 35V170H295V35" fill="#e8f7ff" stroke={stroke} strokeWidth="4"/><path d="M68 80H292V168H68Z" fill="#99d9ed"/><path d="M68 80Q95 72 120 80T175 80T230 80T292 80" fill="none" stroke="#248aaf" strokeWidth="3"/><g className="trial-object" style={{ transform: `translateY(${floating ? 64 : 136}px)` }}><ellipse cx="180" cy="0" rx="22" ry="13" fill={id === 'coin' ? '#e6bb55' : id === 'stone' ? '#88979e' : '#c28c56'}/></g><text x="180" y="199">{floating ? '물 표면에 떠 있어요' : '바닥으로 가라앉아요'}</text></>;
  } else if (experiment === 'dissolve') {
    const dissolved = id === 'salt' || id === 'sugar';
    scene = <><path d="M95 30V170H265V30" fill="#d9f4fc" stroke={stroke} strokeWidth="4"/>{id === 'oil' && <path d="M98 65H262V85H98Z" fill="#eed275"/>}{(dissolved ? [115,145,175,205,235] : [125,150,175,200,225]).map((x, i) => <circle key={x} cx={x} cy={dissolved ? 95 + (i % 3) * 23 : 159} r={dissolved ? 3 : 7} fill={id === 'sand' ? '#ba8b54' : id === 'oil' ? 'transparent' : '#478fb4'}/>)}<text x="180" y="198">{dissolved ? '물속에 퍼져 있어요 (확대 모형)' : id === 'sand' ? '알갱이가 바닥에 남아요' : '서로 다른 층이 생겨요'}</text></>;
  } else if (experiment === 'circuit') {
    scene = <><path d="M110 55H65V155H295V55H220" fill="none" stroke={id === 'closed' ? '#e2ad22' : '#8c9ba8'} strokeWidth="6"/>{id !== 'no-battery' ? <><rect x="110" y="38" width="65" height="32" rx="4" fill="#3a9478"/><text x="142" y="59" fill="white">+ −</text></> : <text x="142" y="58">전지 없음</text>}<path d="M175 55H220" stroke={stroke} strokeWidth="4"/>{id === 'open' && <><path d="M145 155H205" stroke="#fff" strokeWidth="12"/><path d="M145 155L200 127" stroke={stroke} strokeWidth="4"/></>}<circle cx="295" cy="110" r="27" fill={id === 'closed' ? '#ffdc5b' : '#e2e9ef'} stroke={stroke} strokeWidth="3"/><path d="M280 100L310 120M310 100L280 120" stroke={stroke} strokeWidth="2"/><text x="180" y="199">{id === 'closed' ? '전구를 지나는 길이 이어졌어요' : '어느 조건이 달라졌나요?'}</text></>;
  } else if (experiment === 'seed') {
    scene = <><rect x="60" y="133" width="240" height="36" rx="10" fill="#b58c67"/><ellipse cx="180" cy="130" rx="18" ry="12" fill="#c99b61"/>{id === 'good' && <g className="trial-grow"><path d="M180 130Q168 98 180 65M180 130Q190 150 175 161" fill="none" stroke="#40965e" strokeWidth="5"/><ellipse cx="165" cy="85" rx="17" ry="9" fill="#7dc77b" transform="rotate(25 165 85)"/><ellipse cx="194" cy="72" rx="16" ry="9" fill="#57b96b" transform="rotate(-25 194 72)"/></g>}<text x="180" y="43">{id === 'cold' ? '❄ 낮은 온도 + 물' : id === 'dry' ? '따뜻함 + 물 없음' : '따뜻함 + 알맞은 물'}</text><text x="180" y="199">{id === 'good' ? '시간을 축약한 발아 모형' : '같은 관찰 기간의 모습'}</text></>;
  } else if (experiment === 'friction') {
    const x = id === 'tile' ? 270 : id === 'wood' ? 180 : 100;
    scene = <><rect x="30" y="132" width="300" height="20" rx="3" fill={id === 'tile' ? '#bfdae4' : id === 'wood' ? '#c99e6d' : '#6c7b85'}/><path d="M40 155V175M320 155V175" stroke={stroke}/><g className="trial-car" style={{ transform: `translateX(${x}px)` }}><rect x="-22" y="103" width="44" height="22" rx="6" fill="#ef7851"/><circle cx="-13" cy="129" r="8" fill={stroke}/><circle cx="13" cy="129" r="8" fill={stroke}/></g><path d={`M40 170H${x}`} stroke="#2a839a" strokeWidth="3" strokeDasharray="6 4"/><text x="180" y="199">이동 거리의 상대적인 비교 (눈금 아님)</text></>;
  } else if (experiment === 'absorb') {
    const absorbs = id === 'paper' || id === 'cloth';
    scene = <><rect x="75" y="90" width="210" height="65" rx="8" fill={id === 'foil' ? '#acbac4' : '#eadcc1'} stroke={stroke} strokeWidth="2"/>{absorbs ? <ellipse className="trial-grow" cx="180" cy="121" rx={id === 'paper' ? 65 : 40} ry="24" fill="#69bdda" opacity=".7"/> : [135,180,225].map((x) => <ellipse key={x} cx={x} cy="105" rx="13" ry="9" fill="#4aadd3"/>)}<text x="180" y="52">같은 양의 물을 떨어뜨려요</text><text x="180" y="199">{absorbs ? '재료에 스며드는 모습' : '표면에 맺히는 모습'}</text></>;
  } else if (experiment === 'color') {
    const colors = id === 'orange' ? ['#e95555','#f3d64c','#ed973e'] : id === 'green' ? ['#f3d64c','#4d88dc','#64a65a'] : ['#e95555','#4d88dc','#9261b5'];
    scene = <><circle cx="100" cy="70" r="27" fill={colors[0]}/><circle cx="260" cy="70" r="27" fill={colors[1]}/><path d="M120 96L160 121M240 96L200 121" stroke={stroke} strokeWidth="3"/><ellipse className="trial-grow" cx="180" cy="144" rx="52" ry="29" fill={colors[2]}/><text x="180" y="199">물감 혼합의 대표 색</text></>;
  } else if (experiment === 'surface') {
    scene = <><ellipse cx="180" cy="110" rx="130" ry="67" fill="#d8f3fb" stroke="#76b3c7" strokeWidth="4"/>{Array.from({ length: 14 }, (_, i) => { const angle = i * Math.PI * 2 / 14; return <circle key={i} cx={180 + Math.cos(angle) * (id === 'soap' ? 112 : 45)} cy={110 + Math.sin(angle) * (id === 'soap' ? 51 : 24)} r="3" fill="#5b5149"/>; })}<path d="M180 20V100" stroke={id === 'soap' ? '#8ab98e' : '#c0c9d1'} strokeWidth="8" strokeLinecap="round"/><text x="180" y="199">{id === 'soap' ? '물의 흐름을 따라 후추가 퍼져요' : '새 물 + 깨끗한 면봉'}</text></>;
  } else {
    scene = <><path d="M155 80V110L130 165Q180 185 230 165L205 110V80Z" fill="#e1f1ee" stroke={stroke} strokeWidth="3"/>{id === 'mix' ? <><ellipse className="trial-grow" cx="180" cy="47" rx="38" ry="32" fill="#f09aa9"/>{[155,175,195,210].map((x,i) => <circle key={x} cx={x} cy={143 - i * 9} r="7" fill="white" stroke="#83b8af"/>)}</> : <text x="180" y="145">{id === 'soda' ? '가루' : '식초'}</text>}<text x="180" y="199">{id === 'mix' ? '거품과 기체가 생기는 모형' : '섞기 전 모습을 관찰해요'}</text></>;
  }
  return <svg className="trial-visual" viewBox="0 0 360 220" role="img" aria-label={`${trial.name}: ${trial.result}`}><title>{trial.name}: {trial.result}</title>{scene}</svg>;
}
