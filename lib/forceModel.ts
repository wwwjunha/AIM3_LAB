export type BoxMass = 'light' | 'heavy';

export type ForceTrial = {
  mass: BoxMass;
  force: number;
  distance: number;
};

export const boxLabels: Record<BoxMass, string> = {
  light: '가벼운 상자',
  heavy: '무거운 상자',
};

export const MAX_DISTANCE = 80;

// A deliberately simple classroom model: same floor and push duration for every trial.
export function travelDistance(mass: BoxMass, force: number): number {
  const weight = mass === 'light' ? 1 : 2;
  const effort = Math.max(0, Math.min(90, force) - 8 * weight);
  return Math.min(MAX_DISTANCE, Math.round((effort * 0.95) / Math.sqrt(weight)));
}
