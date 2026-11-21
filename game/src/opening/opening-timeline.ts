// The opening's clock (docs/03, "Opening: the kit becomes a ball"). Pure functions only, so the
// timing can be unit-tested without three.js or a DOM.

type OpeningPhaseName = 'gather' | 'panels' | 'stitch' | 'stamp' | 'ready';

export interface OpeningPhaseState {
  phase: OpeningPhaseName;
  /** 0→1 while the kit flies in and gathers into a cluster. */
  gather: number;
  /** 0→1 while the cluster turns into four leather quarters that close into the ball. */
  panels: number;
  /** 0→1 while the seam stitches itself (main seam, then the quarter seams). */
  seam: number;
  /** 0→1 while the ball turns to show the gold HT stamp and the foil shines. */
  stamp: number;
}

// The gather plays the baked kit flight (about 2.8 s, see kit-flight.json); the leather starts
// closing over the pile while it is still settling.
export const GATHER_START = 0.2;
export const GATHER_END = 2.2;
export const PANELS_END = 2.9;
export const STITCH_END = 3.6;
export const STAMP_END = 4.5;

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

/** Overshoots a little past 1 and settles: the "snap" when the leather quarters close. */
export function easeOutBack(t: number): number {
  const c = clamp(t);
  const k = 1.70158;
  return 1 + (k + 1) * (c - 1) ** 3 + k * (c - 1) ** 2;
}

function span(t: number, start: number, end: number): number {
  return clamp((t - start) / (end - start));
}

/** Where the opening is at `t` seconds. */
export function openingPhase(t: number): OpeningPhaseState {
  const state: OpeningPhaseState = {
    phase: 'ready',
    gather: span(t, GATHER_START, GATHER_END),
    panels: span(t, GATHER_END, PANELS_END),
    seam: span(t, PANELS_END, STITCH_END),
    stamp: span(t, STITCH_END, STAMP_END)
  };
  if (t < GATHER_END) state.phase = 'gather';
  else if (t < PANELS_END) state.phase = 'panels';
  else if (t < STITCH_END) state.phase = 'stitch';
  else if (t < STAMP_END) state.phase = 'stamp';
  return state;
}
