import { describe, it, expect } from 'vitest';
import {
  GATHER_END,
  GATHER_START,
  PANELS_END,
  STAMP_END,
  STITCH_END,
  clamp,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  openingPhase
} from '../../game/src/opening/opening-timeline';

describe('opening timeline', () => {
  it('clamps', () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(1.5)).toBe(1);
    expect(clamp(0.4)).toBe(0.4);
  });

  it('eases from 0 to 1 and the in/out curves never go backwards', () => {
    let prevIn = -1;
    let prevOut = -1;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      expect(easeInOutCubic(t)).toBeGreaterThanOrEqual(prevIn);
      expect(easeOutCubic(t)).toBeGreaterThanOrEqual(prevOut);
      prevIn = easeInOutCubic(t);
      prevOut = easeOutCubic(t);
    }
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
  });

  it('lets the quarters overshoot a little before settling (the snap)', () => {
    const peak = Math.max(...Array.from({ length: 50 }, (_, i) => easeOutBack(i / 49)));
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.15);
  });

  it('runs the phases in the order of docs/03', () => {
    expect(openingPhase(0).phase).toBe('gather');
    expect(openingPhase(GATHER_END - 0.01).phase).toBe('gather');
    expect(openingPhase(GATHER_END).phase).toBe('panels');
    expect(openingPhase(PANELS_END).phase).toBe('stitch');
    expect(openingPhase(STITCH_END).phase).toBe('stamp');
    expect(openingPhase(STAMP_END).phase).toBe('ready');
    expect(openingPhase(99).phase).toBe('ready');
  });

  it('finishes each step before the next starts', () => {
    const atPanels = openingPhase(GATHER_END + 0.1);
    expect(atPanels.gather).toBe(1);
    expect(atPanels.seam).toBe(0);
    const atStitch = openingPhase(PANELS_END + 0.1);
    expect(atStitch.panels).toBe(1);
    expect(atStitch.stamp).toBe(0);
    const ready = openingPhase(STAMP_END);
    expect([ready.gather, ready.panels, ready.seam, ready.stamp]).toEqual([1, 1, 1, 1]);
    expect(openingPhase(GATHER_START - 0.1).gather).toBe(0);
  });

  it('only ever moves forward', () => {
    let prev = openingPhase(0);
    for (let t = 0; t <= STAMP_END + 1; t += 0.05) {
      const cur = openingPhase(t);
      expect(cur.gather).toBeGreaterThanOrEqual(prev.gather);
      expect(cur.panels).toBeGreaterThanOrEqual(prev.panels);
      expect(cur.seam).toBeGreaterThanOrEqual(prev.seam);
      expect(cur.stamp).toBeGreaterThanOrEqual(prev.stamp);
      prev = cur;
    }
  });
});
