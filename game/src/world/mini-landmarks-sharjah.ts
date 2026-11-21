import type { ColorBatch } from './mini-batch';
import { addBand, flatColor } from './mini-bands';
import { MC, TAU, arcPt, floodlight, posts, roof, scoreboard, terrace } from './mini-parts';

const SAND = 0xd8c196;
const SAND_DARK = 0xb89c6a;
const BLACK = 0x2b2b30;

/** A low beige boundary wall round the whole bowl. */
function addBoundaryWall(b: ColorBatch): void {
  addBand(b, {
    a0: 0,
    a1: TAU,
    rxIn: 1.85 + 1.1,
    rzIn: 2.1 + 1.1,
    rxOut: 1.85 + 1.18,
    rzOut: 2.1 + 1.18,
    yIn: 0.3,
    yOut: 0.3,
    thick: 0.3,
    segs: 40,
    color: flatColor(0xcdb48a)
  });
}

/** White scalloped fascia on the main stand's roof edge. */
function addFascia(b: ColorBatch): void {
  const a0 = Math.PI - 1.0;
  const a1 = Math.PI + 1.0;
  for (let i = 0; i < 15; i++) {
    const a = a0 + ((a1 - a0) * i) / 14;
    const p = arcPt(a, 0.93);
    b.box(MC.white, 0.1, 0.09, 0.06, { x: p.x, z: p.z, y: 0.74, ry: -a });
  }
}

/** The city skyline: low muted blocks behind the bowl. */
function addSkyline(b: ColorBatch): void {
  const cols = [0x9aa3ad, 0xb6a999, 0x8e96a0, 0xc2b8a8];
  for (let i = 0; i < 12; i++) {
    const h = 0.25 + ((i * 37) % 11) * 0.06;
    b.box(cols[i % cols.length] ?? MC.grey, 0.38, h, 0.3, {
      x: -3.0 + i * 0.55,
      z: -3.25,
      y: h / 2
    });
  }
}

/** Dark pyramid tents on the east terrace. */
function addTents(b: ColorBatch): void {
  for (const dz of [-0.55, 0, 0.55]) {
    b.cone(BLACK, 0.3, 0.32, 4, { x: 2.5, z: dz, y: 0.32, ry: Math.PI / 4 });
  }
}

export function addSharjah(b: ColorBatch): void {
  terrace(b, {
    a0: 0,
    a1: TAU,
    gap: 0.05,
    width: 0.45,
    y0: 0.12,
    y1: 0.4,
    seat: SAND,
    side: SAND_DARK,
    density: 0.4,
    segs: 40
  });
  for (const [a0, a1] of [
    [Math.PI - 1.0, Math.PI + 1.0],
    [-0.6, 0.6]
  ] as const) {
    terrace(b, { a0, a1, gap: 0.5, width: 0.32, y0: 0.44, y1: 0.68, seat: SAND, side: SAND_DARK });
  }
  roof(b, {
    a0: Math.PI - 1.0,
    a1: Math.PI + 1.0,
    gap: 0.3,
    width: 0.65,
    y: 0.78,
    rise: 0.05,
    color: MC.white,
    under: 0xcfc6b0,
    thick: 0.04
  });
  posts(b, MC.grey, 6, Math.PI - 1.0, Math.PI + 1.0, 1.85 + 0.85, 2.1 + 0.85, 0.78);
  addFascia(b);
  addTents(b);
  addBoundaryWall(b);
  addSkyline(b);
  scoreboard(b, -2.95, 0.4, 0.9, 0.5);
  scoreboard(b, 0.5, -2.9, 0.9, 0.5);
  for (const sx of [-1, 1]) {
    const p = arcPt(sx > 0 ? 0.9 : 2.3, 1.35);
    floodlight(b, p.x, p.z, 2.3, 0.4);
  }
}
