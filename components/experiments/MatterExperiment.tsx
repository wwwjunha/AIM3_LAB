'use client';

import { Check, Move, MousePointerClick } from 'lucide-react';
import { recordTrial } from '@/lib/inquiry';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';

type Material = 'water' | 'rock';
type Vessel = 'tall' | 'wide' | 'flask';

const vessels: { id: Vessel; name: string }[] = [{ id: 'tall', name: '긴 컵' }, { id: 'wide', name: '넓은 그릇' }, { id: 'flask', name: '삼각 플라스크' }];

export default function MatterExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [selected, setSelected] = useState<Material>('water');
  const [contents, setContents] = useState<Partial<Record<Vessel, Material>>>({});
  const [tested, setTested] = useState<Record<Material, Vessel[]>>({ water: [], rock: [] });

  function place(vessel: Vessel, material = selected) {
    recordTrial('matter', `${material === 'water' ? '물' : '돌'} → ${vessels.find((item) => item.id === vessel)?.name}`, material === 'water' ? '그릇에 맞게 모양이 달라졌어요.' : '돌의 모양이 유지됐어요.');
    setContents((old) => ({ ...old, [vessel]: material }));
    setTested((old) => ({ ...old, [material]: old[material].includes(vessel) ? old[material] : [...old[material], vessel] }));
  }

  const enough = tested.water.length >= 2 && tested.rock.length >= 2;
  if (step === 4) return <ExperimentShell id="matter" title="물질 연구소" step={4} accent="matter-theme"><SuccessScreen id="matter" title="물질 연구소" report={{ title: '물질 연구소', question: '컵을 바꾸면 물의 모양도 바뀔까?', prediction, observations: [`물을 ${tested.water.length}개의 그릇에 옮겨 모양을 비교했어요.`, `돌을 ${tested.rock.length}개의 그릇에 옮겨 모양을 비교했어요.`, '물은 그릇을 따라 모양이 달라졌지만 돌은 자기 모양을 유지했어요.'], discovery: '액체는 담는 그릇에 따라 모양이 달라지고, 고체는 자기 모양을 유지해요.', skills: ['분류하기', '모양 비교하기', '관찰하기'] }} onRetry={() => { setStep(0); setContents({}); setTested({ water: [], rock: [] }); }} /></ExperimentShell>;

  return (
    <ExperimentShell id="matter" title="물질 연구소" step={step} accent="matter-theme">
      {step === 0 && <section className="question-screen">
        <ScientistGuide>다른 그릇에 넣으면 물과 돌은 어떻게 될까?</ScientistGuide>
        <div className="matter-objects"><div><span>💧</span><strong>물</strong></div><div><span>🪨</span><strong>돌</strong></div></div>
        <h1>컵을 바꾸면 물의 모양도 바뀔까?</h1>
        <PrimaryButton tone="matter" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
      </section>}

      {step === 1 && <section className="prediction-screen">
        <ScientistGuide>정답은 잠깐 숨겨둘게. 먼저 예상해보자!</ScientistGuide>
        <h1>물을 다른 모양의 컵에 옮기면?</h1>
        <div className="choice-grid">
          {['물의 모양도 바뀔 것 같아', '물의 모양은 그대로일 것 같아'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
        </div>
        <PrimaryButton tone="matter" disabled={!prediction} onClick={() => setStep(2)}>직접 확인해보자!</PrimaryButton>
      </section>}

      {step === 2 && <section className="hands-on-screen matter-lab">
        <div className="stage-heading"><span><Move size={20} /> 재료를 옮겨 보자</span><h1>물과 돌을 서로 다른 그릇에 넣어 봐!</h1></div>
        <div className="material-picker" role="group" aria-label="실험 재료 선택">
          {(['water', 'rock'] as Material[]).map((material) => <button key={material} draggable onDragStart={() => setSelected(material)} onClick={() => setSelected(material)} className={selected === material ? 'selected' : ''} aria-pressed={selected === material}><span>{material === 'water' ? '💧' : '🪨'}</span><strong>{material === 'water' ? '물' : '돌'}</strong><small>잡아서 옮기기</small></button>)}
        </div>
        <p className="tap-hint"><MousePointerClick size={19} /> 재료를 고른 뒤 그릇을 눌러도 돼!</p>
        <div className="vessel-grid">
          {vessels.map(({ id, name }) => {
            const content = contents[id];
            return <button className={`vessel-slot ${id}`} key={id} onClick={() => place(id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); place(id); }} aria-label={`선택한 재료를 ${name}에 넣기`}>
              <div className={`vessel ${id}`}>
                {content === 'water' && <div className="liquid" aria-label="담긴 물"><span /></div>}
                {content === 'rock' && <div className="rock-shape" aria-label="담긴 돌">🪨</div>}
              </div>
              <strong>{name}</strong><span>{content ? `${content === 'water' ? '물' : '돌'}을 넣었어` : '여기에 넣기'}</span>
            </button>;
          })}
        </div>
        <div className="trial-status"><span className={tested.water.length >= 2 ? 'done' : ''}>{tested.water.length >= 2 ? '✓' : tested.water.length}/2 물 옮기기</span><span className={tested.rock.length >= 2 ? 'done' : ''}>{tested.rock.length >= 2 ? '✓' : tested.rock.length}/2 돌 옮기기</span></div>
        <PrimaryButton tone="matter" disabled={!enough} onClick={() => setStep(3)}>모양 비교하기</PrimaryButton>
      </section>}

      {step === 3 && <section className="discovery-screen">
        <ScientistGuide>그릇을 바꾸니까 물과 돌이 다르게 보였지?</ScientistGuide>
        <h1>우리가 발견한 것</h1>
        <div className="compare-panels matter"><div><span>💧</span><strong>물</strong><p>그릇이 달라지니까 모양도 달라졌어!</p></div><div><span>🪨</span><strong>돌</strong><p>그릇이 달라도 돌의 모양은 그대로야!</p></div></div>
        <div className="big-discovery"><strong>액체</strong>는 담는 그릇에 따라 모양이 달라질 수 있어요.<br /><strong>고체</strong>는 자기 모양을 유지해요.</div>
        {prediction !== '물의 모양도 바뀔 것 같아' && <p className="prediction-note">예상과 달랐네! 직접 실험해서 알아냈어.</p>}
        <PrimaryButton tone="matter" onClick={() => setStep(4)}>별 받기</PrimaryButton>
      </section>}
    </ExperimentShell>
  );
}
