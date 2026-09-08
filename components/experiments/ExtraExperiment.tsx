'use client';

import { Check, FlaskConical, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { ExperimentShell } from '@/components/ExperimentShell';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScientistGuide } from '@/components/ScientistGuide';
import { SuccessScreen } from '@/components/SuccessScreen';
import type { ExtraExperimentConfig } from '@/lib/extraExperiments';

export default function ExtraExperiment({ config }: { config: ExtraExperimentConfig }) {
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const activeTrial = config.trials.find((trial) => trial.id === active);

  function runTrial(id: string) {
    setActive(id);
    setTested((old) => old.includes(id) ? old : [...old, id]);
  }

  function retry() {
    setStep(0); setPrediction(''); setTested([]); setActive(null);
  }

  if (step === 4) return <ExperimentShell id={config.id} title={config.title} step={4} accent={config.theme}><SuccessScreen id={config.id} title={config.title} report={{ title: config.title, question: config.question, prediction, observations: config.trials.map((trial) => `${trial.name}: ${trial.result}`), discovery: config.discovery, skills: config.skills }} onRetry={retry} /></ExperimentShell>;

  return <ExperimentShell id={config.id} title={config.title} step={step} accent={config.theme}>
    {step === 0 && <section className="question-screen">
      <ScientistGuide>{config.introGuide}</ScientistGuide>
      <div className={`extra-hero ${config.id}`}><span>{config.icon}</span><FlaskConical size={62} /><strong>?</strong></div>
      <h1>{config.question}</h1>
      <PrimaryButton tone={config.id} onClick={() => setStep(1)}>내 생각 정하기</PrimaryButton>
    </section>}

    {step === 1 && <section className="prediction-screen">
      <ScientistGuide>{config.predictionGuide}</ScientistGuide>
      <h1>{config.predictionQuestion}</h1>
      <div className="choice-grid three">{config.predictions.map((choice) => <button className={prediction === choice ? 'selected' : ''} onClick={() => setPrediction(choice)} key={choice}>{prediction === choice && <Check size={24} />}{choice}</button>)}</div>
      <PrimaryButton tone={config.id} disabled={!prediction} onClick={() => setStep(2)}>직접 확인하기</PrimaryButton>
    </section>}

    {step === 2 && <section className="hands-on-screen extra-hands-on">
      <div className="stage-heading"><span><MousePointerClick size={20} /> {config.actionGuide}</span><h1>{config.actionTitle}</h1></div>
      <div className={`extra-lab ${config.id}`}>
        <div className="extra-trials">{config.trials.map((trial) => <button className={tested.includes(trial.id) ? 'tested' : ''} onClick={() => runTrial(trial.id)} key={trial.id}><span>{trial.icon}</span><strong>{trial.name}</strong><small>{tested.includes(trial.id) ? '관찰 완료' : '실험하기'}</small></button>)}</div>
        <div className={`extra-result ${activeTrial ? 'active' : ''}`} aria-live="polite">{activeTrial ? <><span>{activeTrial.resultIcon}</span><strong>{activeTrial.name}</strong><p>{activeTrial.result}</p></> : <><span>{config.icon}</span><strong>실험할 조건을 골라 봐</strong><p>누르면 이곳에서 변화가 보여요.</p></>}</div>
      </div>
      <div className="trial-status"><span className={tested.length === config.trials.length ? 'done' : ''}>{tested.length} / {config.trials.length} 관찰 완료</span></div>
      <PrimaryButton tone={config.id} disabled={tested.length < config.trials.length} onClick={() => setStep(3)}>결과 비교하기</PrimaryButton>
    </section>}

    {step === 3 && <section className="discovery-screen">
      <ScientistGuide>{config.discoveryGuide}</ScientistGuide>
      <h1>우리가 발견한 것</h1>
      <div className={`extra-summary ${config.id}`}>{config.trials.map((trial) => <div key={trial.id}><span>{trial.resultIcon}</span><strong>{trial.name}</strong><p>{trial.result}</p></div>)}</div>
      <div className="big-discovery"><strong>{config.discovery}</strong></div>
      {prediction !== config.expectedPrediction && <p className="prediction-note">예상과 달라도 괜찮아. 직접 실험해서 새로운 사실을 찾았어!</p>}
      <PrimaryButton tone={config.id} onClick={() => setStep(4)}>별 받기</PrimaryButton>
    </section>}
  </ExperimentShell>;
}
