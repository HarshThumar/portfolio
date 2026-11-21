import type { ColorBatch } from './mini-batch';
import { addBand, flatColor } from './mini-bands';
import { MC, RX, RZ, TAU, arcPt, floodlight, terrace } from './mini-parts';

const STEEL = 0x3d5a80;
const FABRIC = 0xe8dcc0;
const CONCRETE = 0xd6cfc0;
const SEAT = 0x4a5b7a;

const wave = (a: number): number => 0.07 * Math.sin(a * 4);

/** The arched truss roof ring with cream fabric panels under it. */
function addRoof(b: ColorBatch): void {
  const segs = 48;
  addBand(
    b,
    {
      a0: 0,
      a1: TAU,
      rxIn: RX + 0.62,
      rzIn: RZ + 0.62,
      rxOut: RX + 1.4,
      rzOut: RZ + 1.4,
      yIn: 1.0,
      yOut: 1.12,
      thick: 0.05,
      segs,
      wave,
      color: (k, _r, face) => (face === 'bottom' ? (k % 4 < 2 ? FABRIC : 0xd5c6a3) : 0xe8dcc0)
    },
    0
  );
  // Truss rings along the inner and outer roof edge.
  for (const [d, y, h] of [
    [0.62, 1.0, 0.1],
    [1.4, 1.12, 0.12]
  ] as const) {
    addBand(b, {
      a0: 0,
      a1: TAU,
      rxIn: RX + d - 0.02,
      rzIn: RZ + d - 0.02,
      rxOut: RX + d + 0.02,
      rzOut: RZ + d + 0.02,
      yIn: y + h,
      yOut: y + h,
      thick: h + 0.03,
      segs,
      wave,
      color: flatColor(STEEL)
    });
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    b.cyl(STEEL, 0.02, 0.02, 0.85 + wave(a), 4, {
      x: Math.cos(a) * (RX + 1.35),
      z: Math.sin(a) * (RZ + 1.35)
    });
  }
}

export function addWankhede(b: ColorBatch): void {
  terrace(b, {
    a0: 0,
    a1: TAU,
    gap: 0.05,
    width: 0.5,
    y0: 0.12,
    y1: 0.4,
    seat: SEAT,
    side: CONCRETE,
    density: 0.5,
    segs: 40
  });
  terrace(b, {
    a0: 0,
    a1: TAU,
    gap: 0.55,
    width: 0.6,
    y0: 0.46,
    y1: 0.88,
    seat: SEAT,
    side: CONCRETE,
    density: 0.5,
    segs: 40
  });
  addRoof(b);
  for (const deg of [25, 150, 215, 335]) {
    const p = arcPt((deg * Math.PI) / 180, 1.3);
    floodlight(b, p.x, p.z, 2.3, 0.4, MC.grey);
  }
}
