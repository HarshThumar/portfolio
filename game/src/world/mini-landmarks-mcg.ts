import type { ColorBatch } from './mini-batch';
import { MC, RX, RZ, TAU, arcPt, floodlight, roof, terrace } from './mini-parts';

const CONCRETE = 0x9aa0a6;
const SEAT = 0x7f9bb2;
const TOWERS_DEG = [18, 72, 138, 198, 252, 318];

/** The tall roof masts that stand above the roof edge. */
function addMasts(b: ColorBatch): void {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * (RX + 1.62);
    const z = Math.sin(a) * (RZ + 1.62);
    b.cyl(MC.greyDark, 0.016, 0.01, 0.42, 4, {
      x,
      z,
      y: 1.0,
      rz: -Math.cos(a) * 0.35,
      rx: Math.sin(a) * 0.35
    });
  }
}

export function addMcg(b: ColorBatch): void {
  const tiers = [
    { gap: 0.05, width: 0.5, y0: 0.12, y1: 0.4 },
    { gap: 0.55, width: 0.42, y0: 0.46, y1: 0.78 },
    { gap: 0.95, width: 0.36, y0: 0.84, y1: 1.2 }
  ];
  for (const t of tiers) {
    terrace(b, { ...t, a0: 0, a1: TAU, seat: SEAT, side: CONCRETE, density: 0.35, segs: 40 });
  }
  roof(b, {
    a0: 0,
    a1: TAU,
    gap: 0.62,
    width: 0.55,
    y: 1.28,
    rise: 0.1,
    color: 0x8d97a2,
    under: 0xd6dce2,
    thick: 0.07,
    segs: 40
  });
  roof(b, {
    a0: 0,
    a1: TAU,
    gap: 1.12,
    width: 0.05,
    y: 1.38,
    rise: 0,
    color: MC.white,
    thick: 0.06,
    segs: 40
  });
  addMasts(b);
  for (const deg of TOWERS_DEG) {
    const p = arcPt((deg * Math.PI) / 180, 1.15);
    floodlight(b, p.x, p.z, 2.4, 0.44);
  }
}
