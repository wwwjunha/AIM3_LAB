import type { ExperimentId, ExperimentRecord, ProgressSnapshot } from '@/types/experiment';

const ids: ExperimentId[] = ['force', 'matter', 'sound'];

const emptyRecord = (): ExperimentRecord => ({ retryCount: 0 });

export function getProgress(): ProgressSnapshot {
  if (typeof window === 'undefined') {
    return { forceCompleted: false, matterCompleted: false, soundCompleted: false, totalStars: 0, records: { force: emptyRecord(), matter: emptyRecord(), sound: emptyRecord() } };
  }

  const completed = Object.fromEntries(ids.map((id) => [`${id}Completed`, localStorage.getItem(`${id}Completed`) === 'true'])) as Record<`${ExperimentId}Completed`, boolean>;
  const records = Object.fromEntries(ids.map((id) => {
    try {
      return [id, JSON.parse(localStorage.getItem(`${id}Record`) || '') as ExperimentRecord];
    } catch {
      return [id, emptyRecord()];
    }
  })) as Record<ExperimentId, ExperimentRecord>;

  return { ...completed, totalStars: ids.filter((id) => completed[`${id}Completed`]).length, records };
}

export function startExperiment(id: ExperimentId) {
  const current = getProgress().records[id];
  const next: ExperimentRecord = current.startedAt
    ? { ...current, retryCount: current.retryCount + 1 }
    : { ...current, startedAt: new Date().toISOString() };
  localStorage.setItem(`${id}Record`, JSON.stringify(next));
}

export function completeExperiment(id: ExperimentId) {
  const current = getProgress().records[id];
  localStorage.setItem(`${id}Completed`, 'true');
  localStorage.setItem(`${id}Record`, JSON.stringify({ ...current, completedAt: current.completedAt || new Date().toISOString() }));
  const total = ids.filter((item) => localStorage.getItem(`${item}Completed`) === 'true').length;
  localStorage.setItem('totalStars', String(total));
}

export function resetProgress() {
  ids.forEach((id) => {
    localStorage.removeItem(`${id}Completed`);
    localStorage.removeItem(`${id}Record`);
  });
  localStorage.removeItem('totalStars');
}
