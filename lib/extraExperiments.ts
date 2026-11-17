import type { ExperimentId } from '@/types/experiment';

export type ExtraTrial = {
  id: string;
  icon: string;
  name: string;
  result: string;
  resultIcon: string;
};

export type ExtraExperimentConfig = {
  id: Extract<ExperimentId, 'float' | 'dissolve' | 'circuit' | 'seed' | 'friction' | 'absorb' | 'color' | 'surface' | 'reaction'>;
  title: string;
  icon: string;
  theme: string;
  introGuide: string;
  question: string;
  predictionGuide: string;
  predictionQuestion: string;
  predictions: string[];
  expectedPrediction: string;
  actionGuide: string;
  actionTitle: string;
  trials: ExtraTrial[];
  discoveryGuide: string;
  discovery: string;
  skills: string[];
};

export const extraExperiments = {
  float: {
    id: 'float', title: '뜨고 가라앉기 연구소', icon: '🛟', theme: 'float-theme',
    introGuide: '물에 넣은 물체는 모두 바닥으로 가라앉을까?', question: '어떤 물체가 물에 뜰까?',
    predictionGuide: '크기만 보지 말고 재료와 무게도 생각해 봐!', predictionQuestion: '가장 잘 뜰 것 같은 물체는?',
    predictions: ['코르크 마개', '동전', '돌멩이'], expectedPrediction: '코르크 마개', actionGuide: '물체를 하나씩 물통에 넣어 봐!', actionTitle: '네 물체가 뜨는지 모두 확인하자',
    trials: [
      { id: 'cork', icon: '🟤', name: '코르크 마개', result: '물 위에 둥둥 떴어요.', resultIcon: '⬆️' },
      { id: 'coin', icon: '🪙', name: '동전', result: '물속 바닥으로 가라앉았어요.', resultIcon: '⬇️' },
      { id: 'cap', icon: '🔵', name: '빈 플라스틱 뚜껑', result: '물 위에 떴어요.', resultIcon: '⬆️' },
      { id: 'stone', icon: '🪨', name: '돌멩이', result: '물속 바닥으로 가라앉았어요.', resultIcon: '⬇️' },
    ],
    discoveryGuide: '물체의 크기만으로 뜨고 가라앉는 것을 정할 수는 없어!', discovery: '물체가 물에 뜨거나 가라앉는 것은 재료와 무게, 모양에 따라 달라질 수 있어요.', skills: ['예상하기', '뜨고 가라앉기 분류', '결과 비교하기'],
  },
  dissolve: {
    id: 'dissolve', title: '용해 연구소', icon: '🥄', theme: 'dissolve-theme',
    introGuide: '물에 넣으면 모두 눈앞에서 사라질까?', question: '어떤 물질이 물에 녹을까?',
    predictionGuide: '젓고 난 뒤 물속을 자세히 상상해 봐.', predictionQuestion: '물에 잘 녹을 것 같은 것은?',
    predictions: ['소금', '모래', '식용유'], expectedPrediction: '소금', actionGuide: '재료를 물에 넣고 같은 횟수로 저어 봐!', actionTitle: '네 재료를 물과 섞어 관찰하자',
    trials: [
      { id: 'salt', icon: '🧂', name: '소금', result: '알갱이가 보이지 않게 물에 녹았어요.', resultIcon: '✨' },
      { id: 'sugar', icon: '🍬', name: '설탕', result: '저으니 물에 녹았어요.', resultIcon: '✨' },
      { id: 'sand', icon: '🏖️', name: '모래', result: '녹지 않고 바닥에 가라앉았어요.', resultIcon: '⬇️' },
      { id: 'oil', icon: '🫗', name: '식용유', result: '물에 녹지 않고 위에 따로 모였어요.', resultIcon: '〰️' },
    ],
    discoveryGuide: '물에 넣는다고 모든 물질이 녹는 것은 아니야!', discovery: '물질의 종류에 따라 물에 녹는 것도 있고 녹지 않는 것도 있어요.', skills: ['같은 방법으로 젓기', '용해 여부 분류', '관찰하기'],
  },
  circuit: {
    id: 'circuit', title: '전기 회로 연구소', icon: '💡', theme: 'circuit-theme',
    introGuide: '전지와 전구를 어떻게 이어야 불이 켜질까?', question: '전구에 불이 켜지려면 무엇이 필요할까?',
    predictionGuide: '전기가 지나가는 길의 모양을 생각해 봐.', predictionQuestion: '불이 켜지는 회로는?',
    predictions: ['길이 모두 이어진 회로', '전선이 끊긴 회로', '전지가 없는 회로'], expectedPrediction: '길이 모두 이어진 회로', actionGuide: '세 가지 회로의 스위치를 눌러 봐!', actionTitle: '전기가 흐르는 길을 비교하자',
    trials: [
      { id: 'closed', icon: '🔋➰💡', name: '모두 이어진 회로', result: '전구에 환하게 불이 켜졌어요!', resultIcon: '💡' },
      { id: 'open', icon: '🔋〰️　💡', name: '전선이 끊긴 회로', result: '전기가 지나갈 길이 끊겨 불이 안 켜졌어요.', resultIcon: '🌑' },
      { id: 'no-battery', icon: '➰💡', name: '전지가 없는 회로', result: '전기를 공급하는 전지가 없어 불이 안 켜졌어요.', resultIcon: '🌑' },
    ],
    discoveryGuide: '전지가 있고 전기가 지나가는 길이 끊김없이 이어져야 해!', discovery: '전구에 불이 켜지려면 전지와 전선, 전구가 끊김없이 이어진 닫힌 회로가 필요해요.', skills: ['회로 비교하기', '원인 찾기', '조건 확인하기'],
  },
  seed: {
    id: 'seed', title: '씨앗 연구소', icon: '🌰', theme: 'seed-theme',
    introGuide: '씨앗은 어디에 두어도 똑같이 싹이 날까?', question: '씨앗이 싹트려면 어떤 조건이 필요할까?',
    predictionGuide: '씨앗도 살아 있는 생명이라는 점을 생각해 봐.', predictionQuestion: '가장 먼저 싹이 날 조건은?',
    predictions: ['따뜻하고 촉촉한 곳', '물 없는 곳', '아주 차가운 곳'], expectedPrediction: '따뜻하고 촉촉한 곳', actionGuide: '각 씨앗의 시간을 보내며 변화를 봐!', actionTitle: '조건이 다른 씨앗을 모두 관찰하자',
    trials: [
      { id: 'good', icon: '💧🌰☀️', name: '따뜻하고 촉촉하게', result: '껍질이 열리고 어린 뿌리가 나왔어요.', resultIcon: '🌱' },
      { id: 'dry', icon: '🌰🏜️', name: '물 없이 따뜻하게', result: '마른 씨앗은 거의 변하지 않았어요.', resultIcon: '🌰' },
      { id: 'cold', icon: '💧🌰❄️', name: '촉촉하지만 차갑게', result: '같은 시간 동안 싹트는 변화가 매우 느렸어요.', resultIcon: '🧊' },
    ],
    discoveryGuide: '씨앗이 싹트는 데에는 알맞은 물과 온도, 공기가 필요해!', discovery: '이 실험에서는 알맞은 물과 따뜻한 온도가 있을 때 씨앗이 싹텄어요. 공기도 필요하지만 이 화면에서는 따로 비교하지 않았어요.', skills: ['생명 변화 관찰', '조건 비교하기', '시간에 따른 변화 보기'],
  },
  friction: {
    id: 'friction', title: '마찰 연구소', icon: '🛝', theme: 'friction-theme',
    introGuide: '같은 자동차도 바닥이 달라지면 이동 거리가 달라질까?', question: '어떤 바닥에서 자동차가 멀리 갈까?',
    predictionGuide: '매끈한 바닥과 거친 바닥의 느낌을 떠올려 봐.', predictionQuestion: '자동차가 가장 멀리 갈 바닥은?',
    predictions: ['매끈한 타일', '나무판', '거친 사포'], expectedPrediction: '매끈한 타일', actionGuide: '같은 높이에서 자동차를 출발시켜 봐!', actionTitle: '세 바닥의 이동 거리를 비교하자',
    trials: [
      { id: 'tile', icon: '🏎️▫️', name: '매끈한 타일', result: '자동차가 가장 멀리 이동했어요.', resultIcon: '📏📏📏' },
      { id: 'wood', icon: '🏎️🪵', name: '나무판', result: '자동차가 중간 거리까지 이동했어요.', resultIcon: '📏📏' },
      { id: 'sandpaper', icon: '🏎️▪️', name: '거친 사포', result: '자동차가 금방 멈췄어요.', resultIcon: '📏' },
    ],
    discoveryGuide: '이 실험에서는 사포 바닥에서 움직임을 방해하는 마찰이 가장 크게 작용했어!', discovery: '같은 조건으로 출발해도 바닥 재료에 따라 마찰이 달라 자동차가 멈추는 거리가 달라져요. 이 실험에서는 사포에서 가장 빨리 멈췄어요.', skills: ['공정하게 출발시키기', '거리 비교하기', '마찰 이해하기'],
  },
  absorb: {
    id: 'absorb', title: '흡수 연구소', icon: '🧽', theme: 'absorb-theme',
    introGuide: '물 한 방울을 떨어뜨리면 재료마다 같은 일이 생길까?', question: '어떤 재료가 물을 잘 흡수할까?',
    predictionGuide: '재료에 작은 구멍이나 틈이 있는지 생각해 봐.', predictionQuestion: '물을 가장 많이 흡수할 것은?',
    predictions: ['키친타월', '플라스틱', '알루미늄 포일'], expectedPrediction: '키친타월', actionGuide: '같은 양의 물을 재료마다 떨어뜨려 봐!', actionTitle: '네 재료의 물 흡수를 비교하자',
    trials: [
      { id: 'paper', icon: '🧻', name: '키친타월', result: '물이 빠르게 스며들었어요.', resultIcon: '💧💧💧' },
      { id: 'cloth', icon: '🧣', name: '면 천', result: '물이 천천히 스며들었어요.', resultIcon: '💧💧' },
      { id: 'plastic', icon: '🛍️', name: '플라스틱', result: '물이 스며들지 않고 맺혔어요.', resultIcon: '💧' },
      { id: 'foil', icon: '▰', name: '알루미늄 포일', result: '물이 흡수되지 않고 표면에 남았어요.', resultIcon: '💧' },
    ],
    discoveryGuide: '재료의 성질에 따라 물을 흡수하는 정도가 달라!', discovery: '재료마다 물을 흡수하는 정도가 다르며 플라스틱과 금속 포일은 물을 거의 흡수하지 않아요.', skills: ['같은 양 사용하기', '흡수 정도 비교', '재료 분류하기'],
  },
  color: {
    id: 'color', title: '색 혼합 연구소', icon: '🎨', theme: 'color-theme',
    introGuide: '서로 다른 두 물감을 섞으면 어떤 색이 태어날까?', question: '두 색을 섞으면 새로운 색이 될까?',
    predictionGuide: '빨강, 노랑, 파랑 물감을 섞는 장면을 떠올려 봐.', predictionQuestion: '빨강과 노랑을 섞으면?',
    predictions: ['주황', '초록', '보라'], expectedPrediction: '주황', actionGuide: '두 색 물감을 골라 섞어 봐!', actionTitle: '세 가지 색 조합을 모두 만들어 보자',
    trials: [
      { id: 'orange', icon: '🔴＋🟡', name: '빨강 + 노랑', result: '따뜻한 주황색이 만들어졌어요.', resultIcon: '🟠' },
      { id: 'green', icon: '🟡＋🔵', name: '노랑 + 파랑', result: '싱그러운 초록색이 만들어졌어요.', resultIcon: '🟢' },
      { id: 'purple', icon: '🔴＋🔵', name: '빨강 + 파랑', result: '진한 보라색이 만들어졌어요.', resultIcon: '🟣' },
    ],
    discoveryGuide: '물감 두 색을 섞으면 처음과 다른 새로운 색을 만들 수 있어!', discovery: '물감의 빨강, 노랑, 파랑을 두 가지씩 섞으면 주황, 초록, 보라를 만들 수 있어요.', skills: ['색 조합하기', '변화 관찰하기', '규칙 찾기'],
  },
  surface: {
    id: 'surface', title: '표면 장력 연구소', icon: '🫧', theme: 'surface-theme',
    introGuide: '물 위 후추에 비누가 닿으면 무슨 일이 생길까?', question: '비누는 물 표면을 어떻게 바꿀까?',
    predictionGuide: '깨끗한 면봉과 비누 묻은 면봉을 비교해 봐.', predictionQuestion: '비누가 닿은 후추는?',
    predictions: ['가장자리로 빠르게 움직여요', '그대로 있어요', '물속으로 모두 가라앉아요'], expectedPrediction: '가장자리로 빠르게 움직여요', actionGuide: '각각 새 물에 면봉을 대어 비교해 봐!', actionTitle: '물 표면의 변화를 비교하자',
    trials: [
      { id: 'clean', icon: '⚪', name: '깨끗한 면봉', result: '후추가 거의 그대로 있었어요.', resultIcon: '••••' },
      { id: 'soap', icon: '🧼', name: '비누 묻은 면봉', result: '후추가 가장자리로 빠르게 퍼졌어요!', resultIcon: '•　　•' },
    ],
    discoveryGuide: '비누가 물 표면의 당기는 힘을 약하게 만들었어!', discovery: '물 표면에는 서로 당기는 힘인 표면 장력이 있고, 비누가 닿은 부분의 표면 장력이 작아지면서 생긴 물의 흐름을 따라 후추가 움직여요.', skills: ['전후 비교하기', '빠른 변화 관찰', '원인 찾기'],
  },
  reaction: {
    id: 'reaction', title: '반응 연구소', icon: '🎈', theme: 'reaction-theme',
    introGuide: '베이킹소다와 식초를 만나게 하면 어떤 변화가 생길까?', question: '두 물질을 섞으면 새로운 기체가 생길까?',
    predictionGuide: '두 재료가 따로 있을 때와 만났을 때를 비교해 봐.', predictionQuestion: '두 재료를 섞으면?',
    predictions: ['거품과 기체가 생겨요', '아무 변화 없어요', '모두 얼어붙어요'], expectedPrediction: '거품과 기체가 생겨요', actionGuide: '따로 관찰한 뒤 마지막에 두 재료를 섞어 봐!', actionTitle: '세 가지 조건의 변화를 확인하자',
    trials: [
      { id: 'soda', icon: '🥄', name: '베이킹소다만 보기', result: '가루만 있을 때는 눈에 띄는 변화가 없어요.', resultIcon: '⚪' },
      { id: 'vinegar', icon: '🧴', name: '식초만 보기', result: '식초만 있을 때도 거품이 생기지 않았어요.', resultIcon: '💧' },
      { id: 'mix', icon: '🥄＋🧴', name: '두 재료 섞기', result: '거품과 이산화 탄소 기체가 생겨 풍선이 부풀었어요!', resultIcon: '🎈' },
    ],
    discoveryGuide: '두 물질이 만나 성질이 다른 이산화 탄소 기체가 생겼어!', discovery: '베이킹소다와 식초가 반응하면 거품과 이산화 탄소 기체가 생겨요.', skills: ['변화 전후 비교', '기체 발생 관찰', '원인과 결과 찾기'],
  },
} satisfies Record<string, ExtraExperimentConfig>;
