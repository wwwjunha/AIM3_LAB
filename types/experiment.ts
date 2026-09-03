export type ExperimentId = 'force' | 'matter' | 'sound';

export type ExperimentRecord = {
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
};

export type ProgressSnapshot = {
  forceCompleted: boolean;
  matterCompleted: boolean;
  soundCompleted: boolean;
  totalStars: number;
  records: Record<ExperimentId, ExperimentRecord>;
};
