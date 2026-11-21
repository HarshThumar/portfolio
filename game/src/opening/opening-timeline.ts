export type OpeningPhaseName = 'gather' | 'stitch' | 'ready';

export interface OpeningPhaseState {
  phase: OpeningPhaseName;
  assembled: number;
  seam: number;
}

export const GATHER_START = 0.3;
export const GATHER_END = 3.0;
export const STITCH_END = 3.6;

export function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

export function easeInOutCubic(t: number): number {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
}

export function easeOutCubic(t: number): number {
  const c = clamp(t);
  return 1 - (1 - c) ** 3;
}

/** Normalized and eased progress [0, 1] for a piece flying into the ball. */
export function pieceProgress(t: number, delay: number, duration: number): number {
  if (duration <= 0) return t >= delay ? 1 : 0;
  if (t <= delay) return 0;
  if (t >= delay + duration) return 1;
  const raw = (t - delay) / duration;
  return easeInOutCubic(raw);
}

/** Pure state of the opening animation at timestamp t in seconds. */
export function openingPhase(t: number): OpeningPhaseState {
  if (t < GATHER_END) {
    const raw = (t - GATHER_START) / (GATHER_END - GATHER_START);
    const assembled = clamp(raw);
    return {
      phase: 'gather',
      assembled,
      seam: 0
    };
  }

  if (t < STITCH_END) {
    const raw = (t - GATHER_END) / (STITCH_END - GATHER_END);
    const seam = clamp(raw);
    return {
      phase: 'stitch',
      assembled: 1,
      seam
    };
  }

  return {
    phase: 'ready',
    assembled: 1,
    seam: 1
  };
}
