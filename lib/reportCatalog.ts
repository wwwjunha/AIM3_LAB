import type { ExperimentId } from '@/types/experiment';

export const reportCatalog: Record<ExperimentId, { icon: string; title: string; parentPrompt: string }> = {
  force: { icon: '📦', title: '힘 연구소', parentPrompt: '가벼운 물건과 무거운 물건을 밀 때 느낌이 어떻게 달랐는지 설명해 볼까?' },
  matter: { icon: '💧', title: '물질 연구소', parentPrompt: '물을 다른 그릇에 옮기면 모양이 왜 달라지는지 이야기해 볼까?' },
  sound: { icon: '🎸', title: '소리 연구소', parentPrompt: '줄의 길이가 달라질 때 소리가 어떻게 달라졌는지 흉내 내 볼까?' },
  magnet: { icon: '🧲', title: '자석 연구소', parentPrompt: '집에서 자석에 붙을 것 같은 물건을 하나 더 예상해 볼까?' },
  light: { icon: '🔦', title: '빛 연구소', parentPrompt: '손전등을 어디로 움직여야 그림자가 커지는지 보여 줄 수 있을까?' },
  air: { icon: '🫧', title: '공기 연구소', parentPrompt: '빈 컵 안에 공기가 있었다는 것을 어떤 장면에서 알 수 있었을까?' },
  heat: { icon: '🧊', title: '온도 연구소', parentPrompt: '얼음을 천천히 녹게 하려면 어디에 두면 좋을지 말해 볼까?' },
  plant: { icon: '🌱', title: '식물 연구소', parentPrompt: '색깔 물이 꽃잎까지 간 길을 손가락으로 그려 볼까?' },
  earth: { icon: '⛰️', title: '땅 연구소', parentPrompt: '비가 많이 오는 산에 나무를 심으면 흙을 지키는 데 어떤 도움이 될까?' },
  float: { icon: '🛟', title: '뜨고 가라앉기 연구소', parentPrompt: '크기는 작지만 가라앉는 물체와 크지만 뜨는 물체를 하나씩 말해 볼까?' },
  dissolve: { icon: '🥄', title: '용해 연구소', parentPrompt: '물에 녹은 소금은 정말 없어진 것인지 어떻게 확인할 수 있을까?' },
  circuit: { icon: '💡', title: '전기 회로 연구소', parentPrompt: '전구가 켜지지 않을 때 어떤 부분부터 확인하면 좋을까?' },
  seed: { icon: '🌰', title: '씨앗 연구소', parentPrompt: '씨앗이 건강하게 싹트도록 우리가 해 줄 수 있는 일은 무엇일까?' },
  friction: { icon: '🛝', title: '마찰 연구소', parentPrompt: '비 오는 날 미끄러운 바닥에서 조심해야 하는 까닭을 마찰로 설명해 볼까?' },
  absorb: { icon: '🧽', title: '흡수 연구소', parentPrompt: '물을 쏟았을 때 플라스틱보다 수건을 사용하는 까닭은 무엇일까?' },
  color: { icon: '🎨', title: '색 혼합 연구소', parentPrompt: '오늘 만든 세 가지 색 중 하나를 다시 만들려면 어떤 두 색이 필요할까?' },
  surface: { icon: '🫧', title: '표면 장력 연구소', parentPrompt: '비누가 닿기 전과 후에 후추가 어떻게 달라졌는지 몸으로 표현해 볼까?' },
  reaction: { icon: '🎈', title: '반응 연구소', parentPrompt: '보이지 않는 기체가 생겼다는 것을 풍선으로 어떻게 알 수 있었을까?' },
};
