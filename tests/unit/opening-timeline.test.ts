import { describe, it, expect } from 'vitest';
import {
  GATHER_START,
  GATHER_END,
  STITCH_END,
  pieceProgress,
  openingPhase,
  clamp,
  easeInOutCubic,
  easeOutCubic
} from '../../game/src/opening/opening-timeline';

describe('opening-timeline', () => {
  describe('clamp & easing', () => {
    it('clamps values correctly', () => {
      expect(clamp(-0.5)).toBe(0);
      expect(clamp(1.5)).toBe(1);
      expect(clamp(0.4)).toBe(0.4);
    });

    it('eases monotonically', () => {
      let prevIn = -1;
      let prevOut = -1;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const curIn = easeInOutCubic(t);
        const curOut = easeOutCubic(t);
        expect(curIn).toBeGreaterThanOrEqual(prevIn);
        expect(curOut).toBeGreaterThanOrEqual(prevOut);
        prevIn = curIn;
        prevOut = curOut;
      }
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
    });
  });

  describe('pieceProgress', () => {
    it('returns 0 before delay and 1 after delay + duration', () => {
      expect(pieceProgress(0.2, 0.5, 1.0)).toBe(0);
      expect(pieceProgress(0.5, 0.5, 1.0)).toBe(0);
      expect(pieceProgress(1.5, 0.5, 1.0)).toBe(1);
      expect(pieceProgress(2.0, 0.5, 1.0)).toBe(1);
    });

    it('progresses monotonically between delay and delay + duration', () => {
      const delay = 0.4;
      const duration = 0.8;
      let prev = 0;
      for (let i = 0; i <= 20; i++) {
        const t = delay + (i / 20) * duration;
        const p = pieceProgress(t, delay, duration);
        expect(p).toBeGreaterThanOrEqual(prev);
        expect(p).toBeLessThanOrEqual(1);
        prev = p;
      }
      expect(prev).toBe(1);
    });
  });

  describe('openingPhase', () => {
    it('identifies phase boundaries accurately', () => {
      expect(openingPhase(0).phase).toBe('gather');
      expect(openingPhase(GATHER_START).phase).toBe('gather');
      expect(openingPhase(2.0).phase).toBe('gather');

      expect(openingPhase(GATHER_END).phase).toBe('stitch');
      expect(openingPhase(3.3).phase).toBe('stitch');

      expect(openingPhase(STITCH_END).phase).toBe('ready');
      expect(openingPhase(5.0).phase).toBe('ready');
    });

    it('maintains monotonic progress across phases', () => {
      let prevAssembled = 0;
      let prevSeam = 0;

      for (let t = 0; t <= 4.0; t += 0.1) {
        const { assembled, seam } = openingPhase(t);
        expect(assembled).toBeGreaterThanOrEqual(prevAssembled);
        expect(assembled).toBeLessThanOrEqual(1);
        expect(seam).toBeGreaterThanOrEqual(prevSeam);
        expect(seam).toBeLessThanOrEqual(1);

        prevAssembled = assembled;
        prevSeam = seam;
      }

      const ready = openingPhase(4.0);
      expect(ready.phase).toBe('ready');
      expect(ready.assembled).toBe(1);
      expect(ready.seam).toBe(1);
    });
  });
});
