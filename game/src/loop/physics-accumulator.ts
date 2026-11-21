export interface AccumulatorResult {
  steps: number;
  remainder: number;
  alpha: number;
}

export const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_TIME = 0.1;

export function stepAccumulator(
  accumulator: number,
  dt: number,
  fixedDelta: number = FIXED_TIMESTEP,
  maxDt: number = MAX_FRAME_TIME
): AccumulatorResult {
  const clampedDt = Math.min(Math.max(dt, 0), maxDt);
  let acc = accumulator + clampedDt;
  let steps = 0;

  while (acc >= fixedDelta) {
    acc -= fixedDelta;
    steps++;
  }

  const alpha = fixedDelta > 0 ? acc / fixedDelta : 0;
  return { steps, remainder: acc, alpha };
}
