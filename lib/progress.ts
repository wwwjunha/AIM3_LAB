import { experimentIds, type ExperimentId, type ExperimentRecord, type ExperimentReportInput, type ProgressSnapshot } from '@/types/experiment';

const emptyRecord = (): ExperimentRecord => ({ retryCount: 0 });

export function getProgress(): ProgressSnapshot {
  const blankCompleted = Object.fromEntries(experimentIds.map((id) => [`${id}Completed`, false])) as Record<`${ExperimentId}Completed`, boolean>;
  const blankRecords = Object.fromEntries(experimentIds.map((id) => [id, emptyRecord()])) as Record<ExperimentId, ExperimentRecord>;
  if (typeof window === 'undefined') return { ...blankCompleted, totalStars: 0, records: blankRecords };

  const completed = Object.fromEntries(experimentIds.map((id) => [`${id}Completed`, localStorage.getItem(`${id}Completed`) === 'true'])) as Record<`${ExperimentId}Completed`, boolean>;
  const records = Object.fromEntries(experimentIds.map((id) => {
    try {
      return [id, JSON.parse(localStorage.getItem(`${id}Record`) || '') as ExperimentRecord];
    } catch {
      return [id, emptyRecord()];
    }
  })) as Record<ExperimentId, ExperimentRecord>;

  return { ...completed, totalStars: experimentIds.filter((id) => completed[`${id}Completed`]).length, records };
}

export function startExperiment(id: ExperimentId) {
  const current = getProgress().records[id];
  const next: ExperimentRecord = current.startedAt
    ? { ...current, startedAt: new Date().toISOString(), retryCount: current.retryCount + 1 }
    : { ...current, startedAt: new Date().toISOString() };
  localStorage.setItem(`${id}Record`, JSON.stringify(next));
}

export function completeExperiment(id: ExperimentId, report: ExperimentReportInput) {
  const current = getProgress().records[id];
  const completedAt = new Date().toISOString();
  localStorage.setItem(`${id}Completed`, 'true');
  localStorage.setItem(`${id}Record`, JSON.stringify({
    ...current,
    completedAt,
    report: {
      ...report,
      experimentId: id,
      startedAt: current.startedAt || completedAt,
      completedAt,
      retryCount: current.retryCount,
      completedSteps: 4,
    },
  }));
  const total = experimentIds.filter((item) => localStorage.getItem(`${item}Completed`) === 'true').length;
  localStorage.setItem('totalStars', String(total));
}

export function resetProgress() {
  experimentIds.forEach((id) => {
    localStorage.removeItem(`${id}Completed`);
    localStorage.removeItem(`${id}Record`);
  });
  localStorage.removeItem('totalStars');
}
