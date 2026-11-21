import { describe, it, expect } from 'vitest';
import { stepAccumulator, FIXED_TIMESTEP } from '../../game/src/loop/physics-accumulator';

describe('stepAccumulator', () => {
  it('returns zero steps when dt is 0', () => {
    const result = stepAccumulator(0, 0);
    expect(result.steps).toBe(0);
    expect(result.remainder).toBe(0);
    expect(result.alpha).toBe(0);
  });

  it('steps exactly once for one fixed timestep', () => {
    const result = stepAccumulator(0, FIXED_TIMESTEP);
    expect(result.steps).toBe(1);
    expect(result.remainder).toBeCloseTo(0, 5);
    expect(result.alpha).toBeCloseTo(0, 5);
  });

  it('steps twice for two fixed timesteps', () => {
    const result = stepAccumulator(0, FIXED_TIMESTEP * 2);
    expect(result.steps).toBe(2);
    expect(result.remainder).toBeCloseTo(0, 5);
  });

  it('accumulates remainder across frames and computes interpolation alpha', () => {
    const halfStep = FIXED_TIMESTEP * 0.5;
    const first = stepAccumulator(0, halfStep);
    expect(first.steps).toBe(0);
    expect(first.remainder).toBeCloseTo(halfStep, 5);
    expect(first.alpha).toBeCloseTo(0.5, 5);

    const second = stepAccumulator(first.remainder, halfStep);
    expect(second.steps).toBe(1);
    expect(second.remainder).toBeCloseTo(0, 5);
  });

  it('clamps excessive delta time to prevent spiral of death', () => {
    const largeDt = 1.0; // 1 second lag spike
    const result = stepAccumulator(0, largeDt, FIXED_TIMESTEP, 0.1);
    // 0.1 / (1/60) = 6 steps
    expect(result.steps).toBe(6);
  });
});
