import type { ExperimentId } from '@/types/experiment';

export type SortGroup = 'change' | 'keep' | 'observe';
export type SortItem = { label: string; group: SortGroup };
/** options[0] is always the correct answer; the UI shuffles the order it shows. */
export type Challenge = { icon: string; situation: string; options: string[]; explain: string };
export type StageContent = { sort: SortItem[]; challenges: Challenge[] };

const c = (label: string): SortItem => ({ label, group: 'change' });
const k = (label: string): SortItem => ({ label, group: 'keep' });
const o = (label: string): SortItem => ({ label, group: 'observe' });

/** Content for the 정리해요 (fair-test sort) and 도전해요 (apply to new situations) stages. */
export const stageCatalog: Record<ExperimentId, StageContent> = {
  force: {
    sort: [c('미는 힘의 크기 또는 상자 무게'), k('같은 바닥'), k('미는 시간'), o('상자가 움직인 거리')],
    challenges: [
      { icon: '🛒', situation: '빈 카트와 물건이 가득 찬 카트를 같은 힘으로 밀었어요. 더 멀리 가는 쪽은?', options: ['빈 카트', '가득 찬 카트', '둘 다 똑같다'], explain: '같은 힘이면 가벼운 쪽이 더 멀리 움직여요.' },
      { icon: '⚽', situation: '같은 공을 살살 찰 때와 세게 찰 때, 공이 더 멀리 가는 것은?', options: ['세게 찰 때', '살살 찰 때', '둘 다 똑같다'], explain: '같은 물체라면 더 큰 힘을 줄수록 더 멀리 움직여요.' },
      { icon: '📦', situation: '무거운 상자를 가벼운 상자만큼 멀리 옮기려면?', options: ['더 큰 힘으로 민다', '더 작은 힘으로 민다', '힘과 상관없다'], explain: '무거운 물체를 같은 거리만큼 움직이려면 더 큰 힘이 필요해요.' },
    ],
  },
  matter: {
    sort: [c('담는 그릇의 모양'), k('물의 양'), k('같은 돌'), o('모양이 바뀌는지')],
    challenges: [
      { icon: '🧃', situation: '컵에 있던 주스를 넓은 접시에 부으면 주스의 모양은?', options: ['접시 모양으로 바뀐다', '컵 모양 그대로다'], explain: '액체는 담는 그릇에 따라 모양이 바뀌어요.' },
      { icon: '🧱', situation: '장난감 블록을 큰 상자에 넣으면 블록의 모양은?', options: ['그대로 유지된다', '상자 모양으로 퍼진다'], explain: '고체는 그릇이 바뀌어도 자기 모양을 유지해요.' },
      { icon: '🍯', situation: '꿀은 천천히 흐르지만 그릇에 따라 모양이 바뀌어요. 꿀은 무엇일까?', options: ['액체', '고체'], explain: '천천히 흘러도 담는 그릇에 따라 모양이 바뀌면 액체예요.' },
    ],
  },
  sound: {
    sort: [c('고무줄의 길이'), k('고무줄의 굵기'), k('튕기는 방법'), o('소리의 높낮이')],
    challenges: [
      { icon: '🎸', situation: '기타 줄을 손가락으로 눌러 떨리는 부분을 짧게 하면 소리는?', options: ['높아진다', '낮아진다', '변하지 않는다'], explain: '떨리는 줄이 짧을수록 높은 소리가 나요.' },
      { icon: '🥁', situation: '북을 더 세게 치면 주로 달라지는 것은?', options: ['소리의 크기', '소리의 높낮이'], explain: '세게 치면 소리가 커져요. 소리의 크기와 높낮이는 서로 달라요.' },
      { icon: '🔔', situation: '소리가 나고 있는 종을 살짝 만져 보면?', options: ['떨리고 있다', '가만히 있다'], explain: '소리가 나는 물체는 떨려요.' },
    ],
  },
  magnet: {
    sort: [c('물체의 재료'), k('같은 자석'), k('자석을 대는 방법'), o('자석에 붙는지')],
    challenges: [
      { icon: '🥫', situation: '알루미늄 음료수 캔에 자석을 대면?', options: ['붙지 않는다', '붙는다'], explain: '알루미늄은 금속이지만 자석에 붙지 않아요.' },
      { icon: '🧷', situation: '철로 만든 옷핀에 자석을 대면?', options: ['붙는다', '붙지 않는다'], explain: '철로 된 물체는 자석에 끌려와요.' },
      { icon: '🧊', situation: '냉장고 문에 자석이 붙는 까닭은?', options: ['문 안쪽에 철이 들어 있어서', '문이 차가워서', '문이 하얀색이라서'], explain: '냉장고 문에는 철판이 들어 있어서 자석이 붙어요.' },
    ],
  },
  light: {
    sort: [c('빛과 물체 사이의 거리'), k('물체의 크기'), k('스크린의 위치'), o('그림자의 크기')],
    challenges: [
      { icon: '🔦', situation: '손전등을 인형에 더 가까이 가져가면 그림자는?', options: ['커진다', '작아진다', '그대로다'], explain: '빛이 물체에 가까울수록 그림자가 커져요.' },
      { icon: '🐰', situation: '손 그림자 토끼를 작게 만들려면 손을 어디로 옮길까?', options: ['빛에서 멀리, 벽 가까이', '빛에 더 가까이'], explain: '물체가 빛에서 멀어지면 그림자가 작아져요.' },
      { icon: '☀️', situation: '그림자가 생기려면 꼭 필요한 것은?', options: ['빛과 빛을 가리는 물체', '물과 바람'], explain: '빛이 물체에 가려질 때 그림자가 생겨요.' },
    ],
  },
  air: {
    sort: [c('컵을 넣는 방법 (똑바로·기울여서)'), k('같은 컵'), k('같은 물통'), o('휴지가 젖는지와 공기 방울')],
    challenges: [
      { icon: '🎈', situation: '풍선에 숨을 불어 넣으면 풍선이 커지는 까닭은?', options: ['공기가 공간을 차지해서', '풍선이 스스로 늘어나서'], explain: '눈에 보이지 않아도 공기는 자리를 차지해요.' },
      { icon: '🍼', situation: '빈 병을 거꾸로 해서 물에 똑바로 밀어 넣으면 병 안으로 물이?', options: ['거의 들어가지 않는다', '가득 들어간다'], explain: '병 안의 공기가 자리를 차지하고 있어서 물이 들어가기 어려워요.' },
      { icon: '🫧', situation: '물속에서 병을 기울였을 때 보글보글 나온 방울은?', options: ['병 안에 있던 공기', '물이 변한 것'], explain: '병을 기울이면 안에 있던 공기가 빠져나오고 그 자리에 물이 들어가요.' },
    ],
  },
  heat: {
    sort: [c('주변 온도'), k('얼음의 처음 크기'), k('관찰 시간'), o('얼음이 녹은 정도')],
    challenges: [
      { icon: '🍦', situation: '여름에 아이스크림이 겨울보다 빨리 녹는 까닭은?', options: ['주변 온도가 높아서', '아이스크림 맛이 달라서'], explain: '주변이 따뜻할수록 얼음과 아이스크림이 빨리 녹아요.' },
      { icon: '🧊', situation: '얼음을 천천히 녹게 하려면 어디에 둘까?', options: ['서늘한 그늘', '햇볕 드는 창가'], explain: '온도가 낮은 곳에서는 얼음이 천천히 녹아요.' },
      { icon: '💧', situation: '얼음이 다 녹으면 어떻게 될까?', options: ['물로 남아 있다', '완전히 사라진다'], explain: '녹은 얼음은 물이 돼요. 없어진 게 아니에요.' },
    ],
  },
  plant: {
    sort: [c('관찰하는 시간'), k('같은 꽃'), k('같은 색깔 물'), o('색깔 물이 올라간 위치')],
    challenges: [
      { icon: '🥬', situation: '시든 채소를 물에 담가 두면?', options: ['다시 싱싱해진다', '더 빨리 시든다'], explain: '줄기와 잎을 따라 물이 이동해 다시 싱싱해져요.' },
      { icon: '🌼', situation: '흰 꽃을 파란 물에 꽂으면 가장 나중에 색이 보이는 곳은?', options: ['꽃잎', '줄기 아래쪽'], explain: '물은 줄기 아래에서 위로 올라가서 꽃잎에 가장 늦게 도착해요.' },
      { icon: '🌱', situation: '식물에서 물이 이동하는 통로는?', options: ['줄기', '꽃잎 끝'], explain: '뿌리에서 흡수한 물은 줄기를 지나 잎과 꽃으로 가요.' },
    ],
  },
  earth: {
    sort: [c('비탈의 기울기'), k('흙의 종류와 양'), k('흘려보낸 물의 양'), o('흙이 움직인 양')],
    challenges: [
      { icon: '⛰️', situation: '비가 많이 올 때 흙이 더 많이 쓸려 내려가기 쉬운 곳은?', options: ['가파른 산비탈', '평평한 운동장'], explain: '기울기가 급할수록 흐르는 물이 흙을 더 많이 옮겨요.' },
      { icon: '🌳', situation: '비탈에 나무와 풀을 심으면 흙이 깎이는 것은?', options: ['줄어든다', '늘어난다'], explain: '식물의 뿌리가 흙을 붙잡아 줘요.' },
      { icon: '🏞️', situation: '강물이 옮긴 흙과 모래가 쌓이면 생기는 것은?', options: ['넓고 평평한 땅이나 모래밭', '높은 산'], explain: '흐르는 물은 흙을 깎기도 하고, 옮겨서 쌓기도 해요.' },
    ],
  },
  float: {
    sort: [c('물에 넣는 물체'), k('같은 물통'), k('물에 넣는 방법'), o('뜨는지 가라앉는지')],
    challenges: [
      { icon: '🪵', situation: '큰 나무 토막과 작은 쇠못 중 물에 뜨는 것은?', options: ['큰 나무 토막', '작은 쇠못'], explain: '크기만으로는 알 수 없어요. 무엇으로 만들었는지가 중요해요.' },
      { icon: '🚢', situation: '쇠로 만든 큰 배가 물에 뜰 수 있는 까닭은?', options: ['속이 빈 넓은 모양이라서', '배가 아주 작아서'], explain: '같은 재료라도 모양에 따라 뜨거나 가라앉을 수 있어요.' },
      { icon: '🍎', situation: '사과를 물에 넣으면?', options: ['뜬다', '가라앉는다'], explain: '사과는 물에 떠요. 무거워 보여도 뜰 수 있어요.' },
    ],
  },
  dissolve: {
    sort: [c('넣는 물질의 종류'), k('물의 양과 온도'), k('젓는 횟수'), o('녹아서 보이지 않는지')],
    challenges: [
      { icon: '🍬', situation: '설탕을 물에 넣고 저어서 보이지 않게 되면 설탕은?', options: ['보이지 않지만 물속에 있다', '완전히 없어졌다'], explain: '녹은 물질은 눈에 보이지 않아도 물속에 고르게 퍼져 있어요.' },
      { icon: '🏖️', situation: '모래를 물에 넣고 저은 뒤 가만히 두면?', options: ['바닥에 가라앉는다', '녹아서 사라진다'], explain: '모래는 물에 녹지 않아서 바닥에 가라앉아요.' },
      { icon: '🧂', situation: '녹은 소금이 물속에 있는지 확인하는 방법은?', options: ['선생님과 물을 증발시켜 남는 것을 본다', '물을 더 부어 본다'], explain: '물이 증발하면 녹아 있던 소금이 다시 나타나요. 가열은 꼭 어른과 함께해요.' },
    ],
  },
  circuit: {
    sort: [c('전지 유무와 전선 연결 상태'), k('같은 전구'), k('같은 전선'), o('전구에 불이 켜지는지')],
    challenges: [
      { icon: '🔦', situation: '손전등 스위치를 끄면 불이 꺼지는 까닭은?', options: ['전기가 흐르는 길이 끊겨서', '전구가 고장 나서'], explain: '스위치는 전기가 흐르는 길을 이었다 끊었다 해요.' },
      { icon: '🔋', situation: '전지를 빼고 전선과 전구만 연결하면 전구는?', options: ['켜지지 않는다', '켜진다'], explain: '전기를 보내 주는 전지가 있어야 불이 켜져요.' },
      { icon: '💡', situation: '전구에 불이 켜지기 위한 조건은?', options: ['전지·전선·전구가 끊김 없이 이어진다', '전선 한쪽만 전구에 닿는다'], explain: '전지의 두 극과 전구가 끊김 없는 한 바퀴 길로 이어져야 해요.' },
    ],
  },
  seed: {
    sort: [c('물의 유무 또는 온도'), k('같은 씨앗'), k('같은 관찰 기간'), o('싹이 텄는지')],
    challenges: [
      { icon: '🫘', situation: '콩을 물 없이 마른 접시에 두면?', options: ['싹이 트기 어렵다', '더 빨리 싹이 튼다'], explain: '씨앗이 싹트려면 알맞은 물이 필요해요.' },
      { icon: '❄️', situation: '젖은 솜 위 씨앗을 아주 차가운 곳에 두면 따뜻한 곳보다?', options: ['싹트는 것이 느리거나 안 튼다', '더 빨리 싹튼다'], explain: '씨앗이 싹트려면 알맞은 온도도 필요해요.' },
      { icon: '🔬', situation: '물의 영향만 알아보려면 어떤 두 씨앗을 비교할까?', options: ['둘 다 따뜻한 곳에, 하나만 물 주기', '하나는 따뜻하고 젖게, 하나는 차갑고 마르게'], explain: '알아보려는 조건 하나만 바꾸고 나머지는 같게 해야 공정해요.' },
    ],
  },
  friction: {
    sort: [c('바닥의 재료'), k('같은 자동차'), k('같은 출발 높이'), o('자동차가 간 거리')],
    challenges: [
      { icon: '⛸️', situation: '얼음판 위에서 잘 미끄러지는 까닭은?', options: ['바닥이 매끄러워 마찰이 작아서', '얼음이 차가워서'], explain: '매끄러운 바닥은 움직임을 방해하는 마찰이 작아요.' },
      { icon: '👟', situation: '운동화 바닥에 울퉁불퉁한 무늬가 있는 까닭은?', options: ['마찰을 크게 해 덜 미끄러지려고', '신발을 가볍게 하려고'], explain: '무늬가 바닥과의 마찰을 크게 해서 덜 미끄러져요.' },
      { icon: '🧪', situation: '바닥만 비교하려면 자동차는?', options: ['같은 자동차를 같은 높이에서 출발', '바닥마다 다른 자동차'], explain: '바꾸는 것은 바닥 하나뿐이어야 공정한 비교예요.' },
    ],
  },
  absorb: {
    sort: [c('재료의 종류'), k('떨어뜨리는 물의 양'), k('재료의 크기'), o('물이 스며드는지')],
    challenges: [
      { icon: '🥛', situation: '엎지른 우유를 닦기 좋은 것은?', options: ['키친타월', '비닐봉지'], explain: '종이와 천은 물을 잘 빨아들여요.' },
      { icon: '☔', situation: '비옷을 만들기 좋은 재료는?', options: ['물이 스며들지 않는 비닐', '물을 잘 빨아들이는 천'], explain: '비옷은 물이 스며들지 않아야 해요.' },
      { icon: '⚖️', situation: '흡수를 공정하게 비교하려면?', options: ['재료마다 같은 양의 물을 떨어뜨린다', '잘 흡수하는 재료에 물을 더 준다'], explain: '물의 양처럼 재료 말고 다른 조건은 같게 해야 해요.' },
    ],
  },
  color: {
    sort: [c('섞는 물감의 조합'), k('물감의 양'), k('같은 종이와 붓'), o('새로 만들어진 색')],
    challenges: [
      { icon: '🍊', situation: '빨강과 노랑 물감을 섞으면?', options: ['주황', '초록', '보라'], explain: '빨강과 노랑을 섞으면 주황이 돼요.' },
      { icon: '🌿', situation: '초록색 물감을 만들려면?', options: ['노랑 + 파랑', '빨강 + 노랑', '빨강 + 파랑'], explain: '노랑과 파랑을 섞으면 초록이 돼요.' },
      { icon: '🍇', situation: '보라색에 빨강 물감을 조금 더 넣으면?', options: ['붉은빛 보라가 된다', '노랑이 된다'], explain: '섞는 양을 바꾸면 색이 조금씩 달라져요.' },
    ],
  },
  surface: {
    sort: [c('면봉에 비누가 묻었는지'), k('새로 받은 물'), k('같은 양의 후추'), o('후추가 움직인 모습')],
    challenges: [
      { icon: '🪙', situation: '동전 위에 물방울이 동그랗게 맺히는 까닭은?', options: ['물 표면이 서로 당겨서', '동전이 물을 밀어내서'], explain: '물 표면은 서로 당기는 힘(표면 장력)이 있어 둥글게 모여요.' },
      { icon: '🧼', situation: '비누를 넣었던 물로 다시 실험하면?', options: ['결과를 비교하기 어렵다', '더 정확해진다'], explain: '이미 비누가 섞인 물은 조건이 달라져서 새 물로 해야 해요.' },
      { icon: '📎', situation: '물 위에 살며시 올린 종이 클립이 갑자기 가라앉을 때는?', options: ['비누를 한 방울 떨어뜨렸을 때', '물을 그대로 둘 때'], explain: '비누가 표면 장력을 약하게 해서 클립을 받치지 못해요.' },
    ],
  },
  reaction: {
    sort: [c('두 재료를 섞는지'), k('같은 용기'), k('재료의 양'), o('거품과 풍선의 변화')],
    challenges: [
      { icon: '🎈', situation: '병 위의 풍선이 부풀었다는 것은 무엇이 생겼다는 단서일까?', options: ['기체', '고체'], explain: '거품과 부푼 풍선은 기체가 생겼다는 단서예요.' },
      { icon: '🍞', situation: '베이킹소다를 넣은 반죽이 구울 때 부푸는 까닭은?', options: ['기체가 생겨서', '물이 사라져서'], explain: '베이킹소다가 반응하면 이산화 탄소 기체가 생겨 반죽이 부풀어요.' },
      { icon: '⚠️', situation: '이 실험을 실제로 할 때 안전한 방법은?', options: ['선생님과 함께, 뚜껑을 꽉 닫지 않는다', '병뚜껑을 꽉 닫고 세게 흔든다'], explain: '기체가 갇히면 위험해요. 꼭 어른과 함께, 밀봉하지 않고 해요.' },
    ],
  },
};

export const reasonOptions = ['전에 비슷한 것을 직접 본 적이 있어서', '비슷한 물건을 떠올려 봐서', '책이나 영상에서 본 적이 있어서', '잘 모르지만 느낌으로'];

export const sortGroupLabel: Record<SortGroup, string> = { change: '바꾼 것', keep: '같게 둔 것', observe: '관찰한 결과' };
