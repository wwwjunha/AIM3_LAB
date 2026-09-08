export const experimentIds = ['force', 'matter', 'sound', 'magnet', 'light', 'air', 'heat', 'plant', 'earth', 'float', 'dissolve', 'circuit', 'seed', 'friction', 'absorb', 'color', 'surface', 'reaction'] as const;

export type ExperimentId = (typeof experimentIds)[number];

export type ExperimentReportInput = {
  title: string;
  question: string;
  prediction: string;
  observations: string[];
  discovery: string;
  skills: string[];
};

export type ExperimentReport = ExperimentReportInput & {
  experimentId: ExperimentId;
  startedAt: string;
  completedAt: string;
  retryCount: number;
  completedSteps: number;
};

export type ExperimentRecord = {
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  report?: ExperimentReport;
};

export type ProgressSnapshot = Record<`${ExperimentId}Completed`, boolean> & {
  totalStars: number;
  records: Record<ExperimentId, ExperimentRecord>;
};
