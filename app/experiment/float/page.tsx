import ExtraExperiment from '@/components/experiments/ExtraExperiment';
import { extraExperiments } from '@/lib/extraExperiments';

export default function Page() { return <ExtraExperiment config={extraExperiments.float} />; }
