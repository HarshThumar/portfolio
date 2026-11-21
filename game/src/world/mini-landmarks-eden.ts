import type { ColorBatch } from './mini-batch';
import { BACK, MC, TAU, arcPt, posts, roof, terrace, tent } from './mini-parts';

const BLUE = 0x3f66b0;
const ORANGE = 0xb5694a;
const CANOPY = 0xa0a8b0;

/** Red-and-white waisted lattice tower with a flat panel head, as at the real ground. */
function addTower(b: ColorBatch, x: number, z: number, h: number): void {
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands;
    const t1 = (i + 1) / bands;
    const r = (t: number): number => 0.07 + 0.09 * Math.pow(Math.abs(t - 0.55) * 1.8, 1.6);
    b.cyl(i % 2 === 0 ? MC.red : MC.white, r(t0), r(t1), h / bands, 6, { x, z, y: t0 * h });
  }
  const yaw = Math.atan2(-x, -z);
  b.box(MC.greyDark, 0.5, 0.4, 0.07, { x, z, y: h + 0.17, ry: yaw, rx: -0.2 });
  b.box(MC.cream, 0.44, 0.34, 0.02, {
    x: x + Math.sin(yaw) * 0.045,
    z: z + Math.cos(yaw) * 0.045,
    y: h + 0.17,
    ry: yaw,
    rx: -0.2
  });
}

export function addEden(b: ColorBatch): void {
  const tiers = [
    { gap: 0.05, width: 0.55, y0: 0.12, y1: 0.42 },
    { gap: 0.62, width: 0.5, y0: 0.48, y1: 0.9 }
  ];
  for (const t of tiers) {
    terrace(b, { ...t, a0: 0, a1: TAU, seat: BLUE, side: ORANGE, density: 0.45, segs: 40 });
  }
  for (const [a0, a1] of [
    [-0.85, 0.85],
    [Math.PI - 0.85, Math.PI + 0.85]
  ] as const) {
    roof(b, {
      a0,
      a1,
      gap: 0.45,
      width: 0.95,
      y: 1.05,
      rise: 0.1,
      color: CANOPY,
      under: 0x535a61,
      thick: 0.07
    });
    posts(b, MC.greyDark, 7, a0, a1, 1.85 + 1.35, 2.1 + 1.35, 1.05);
  }
  // Small pavilion with white peaked tents on the back side.
  b.box(MC.cream, 1.2, 0.3, 0.36, { z: -2.55, y: 0.25 });
  b.box(MC.glass, 1.0, 0.1, 0.012, { z: -2.37, y: 0.27 });
  for (let i = 0; i < 5; i++) tent(b, -0.5 + i * 0.25, 0.4, -2.55, 0.17, 0.2, MC.white);
  addTower(b, arcPt(0.55, 1.1).x, arcPt(0.55, 1.1).z, 2.3);
  addTower(b, arcPt(BACK - 0.95, 1.1).x, arcPt(BACK - 0.95, 1.1).z, 2.3);
}
