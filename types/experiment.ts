export const experimentIds = ['force', 'matter', 'sound', 'magnet', 'light', 'air', 'heat', 'plant', 'earth'] as const;

export type ExperimentId = (typeof experimentIds)[number];

export type ExperimentRecord = {
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
};

export type ProgressSnapshot = Record<`${ExperimentId}Completed`, boolean> & {
  totalStars: number;
  records: Record<ExperimentId, ExperimentRecord>;
};
