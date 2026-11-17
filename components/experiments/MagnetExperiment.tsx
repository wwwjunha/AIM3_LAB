'use client';

import { Check, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';
import { josa } from '@/lib/parentInsights';
import { MagnetPlayground, type ObjectGuess } from '@/components/experiments/MagnetPlayground';

const objects = [
  { id: 'clip', name: '철 클립', icon: '📎', sticks: true, material: '철' },
  { id: 'screw', name: '철 나사', icon: '🔩', sticks: true, material: '철' },
  { id: 'aluminum', name: '알루미늄 조각', icon: '🥫', sticks: false, material: '알루미늄' },
  { id: 'block', name: '나무 블록', icon: '🪵', sticks: false, material: '나무' },
  { id: 'spoon', name: '플라스틱 숟가락', icon: '🥄', sticks: false, material: '플라스틱' },
] as const;

export default function MagnetExperiment() {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<Record<string, ObjectGuess>>({});
  const matched = objects.filter((item) => tested.includes(item.id) && guesses[item.id] === (item.sticks ? 'yes' : 'no'));
  const surprises = objects.filter((item) => tested.includes(item.id) && !matched.includes(item));

  function markTested(id: string) {
    setTested((old) => old.includes(id) ? old : [...old, id]);
  }

  function retry() {
    setStep(0);
    setPrediction('');
    setTested([]);
    setGuesses({});
  }

  if (step === 4) return <ExperimentShell id="magnet" title="자석 연구소" step={4} accent="magnet-theme"><SuccessScreen id="magnet" title="자석 연구소" report={{ title: '자석 연구소', question: '어떤 물체가 자석에 붙을까?', prediction, observations: ['철 클립, 철 나사, 알루미늄, 나무, 플라스틱을 하나씩 예상한 뒤 자석을 가까이 가져가 시험했어요.', `다섯 가지 중 ${matched.length}가지는 예상과 같았어요.${surprises.length ? ` 예상과 달랐던 것: ${surprises.map((item) => item.name).join(', ')}.` : ''}`, '철 클립과 철 나사는 가까이 가자 끌려와 붙었고 알루미늄, 나무와 플라스틱은 붙지 않았어요.'], discovery: '자석은 모든 물체가 아니라 철로 된 물체를 끌어당길 수 있어요.', skills: ['재료 분류하기', '예상과 결과 비교하기', '관찰하기'] }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id="magnet" title="자석 연구소" step={step} accent="magnet-theme">
    {step === 0 && <section className="question-screen">
      <ScientistGuide>자석은 모든 물체를 끌어당길까?</ScientistGuide>
      <div className="lab-hero-object"><span>🧲</span><strong>?</strong><span>📎</span><span>🪵</span></div>
      <h1>어떤 물체가 자석에 붙을까?</h1>
      <PrimaryButton tone="magnet" onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>자석에 붙을 것 같은 물체를 골라 봐!</ScientistGuide>
      <h1>어떤 물체가 붙을까?</h1>
      <div className="choice-grid three">
        {['철로 된 물체', '나무로 된 물체', '모든 물체'].map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}
      </div>
      <PrimaryButton tone="magnet" disabled={!prediction} onClick={() => setStep(2)}>자석으로 확인하기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen">
      <div className="stage-heading"><span><MousePointerClick size={20} /> 예상을 고르고, 자석을 끌어서 물체에 가까이 가져가 봐!</span><h1>다섯 가지 재료를 모두 시험해 보자</h1></div>
      <MagnetPlayground objects={objects} guesses={guesses} onGuess={(id, guess) => setGuesses((old) => ({ ...old, [id]: guess }))} tested={tested} onTested={markTested} />
      <div className="trial-status"><span className={tested.length === objects.length ? 'done' : ''}>{tested.length} / {objects.length} 관찰 완료</span></div>
      <PrimaryButton tone="magnet" disabled={tested.length < objects.length} onClick={() => setStep(3)}>결과 모아보기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>재료에 따라 자석에 붙는지 달랐어!</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className="compare-panels"><div><span>📎 🔩</span><strong>철 클립과 철 나사</strong><p>자석에 붙었어!</p></div><div><span>🪵 🥄</span><strong>알루미늄, 나무와 플라스틱</strong><p>자석에 붙지 않았어.</p></div></div>
      <div className="big-discovery">자석은 모든 물체가 아니라<br /><strong>철로 된 물체를 끌어당길 수 있어요.</strong></div>
      <p className="prediction-note">다섯 가지 중 <strong>{matched.length}가지</strong>를 맞게 예상했어.{surprises.length ? ` ${surprises.map((item) => item.name).join(', ')}${josa(surprises[surprises.length - 1].name, '은', '는')} 예상과 달랐지? 실험으로 알아냈으니 더 멋져!` : ' 모두 예상대로였어!'}</p>
      {surprises.some((item) => item.id === 'aluminum') && <p className="prediction-note">알루미늄도 반짝이는 금속이지만 자석에 붙지 않았어. 금속이라고 모두 붙는 건 아니야!</p>}
      <PrimaryButton tone="magnet" onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
