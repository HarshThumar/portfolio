import type { ColorBatch } from './mini-batch';
import {
  BACK,
  MC,
  TAU,
  arcPt,
  floodlight,
  mountain,
  posts,
  roof,
  scoreboard,
  terrace,
  tree
} from './mini-parts';

const ROCK = 0x6a6258;

/** The flat-topped Table Mountain massif with Devil's Peak beside it. */
function addMountains(b: ColorBatch): void {
  const z = -3.0;
  b.cyl(0x5e7a48, 2.0, 1.85, 0.6, 8, { z, sx: 1.7, sz: 0.4 });
  b.cyl(ROCK, 1.85, 1.6, 1.9, 8, { z, y: 0.55, sx: 1.7, sz: 0.4 });
  b.cyl(0x8d8274, 1.61, 1.55, 0.1, 8, { z, y: 2.4, sx: 1.7, sz: 0.4 });
  // Cliff strata, lighter bands on the face.
  b.cyl(0x857a6c, 1.78, 1.76, 0.07, 8, { z, y: 1.3, sx: 1.7, sz: 0.4 });
  b.cyl(0x857a6c, 1.7, 1.68, 0.07, 8, { z, y: 1.85, sx: 1.7, sz: 0.4 });
  mountain(b, 3.1, -2.9, 0.95, 2.4, 0x6a6258, 0, 3);
  mountain(b, -3.1, -2.8, 0.8, 1.6, 0x5e6a50, 0, 8);
}

/** Pavilion with a teal cupola. */
function addPavilion(b: ColorBatch): void {
  const x = -1.0;
  const z = -2.5;
  b.box(MC.cream, 1.0, 0.34, 0.42, { x, z, y: 0.25 });
  b.box(MC.cream, 1.1, 0.03, 0.5, { x, z: z + 0.03, y: 0.43 });
  b.box(MC.glass, 0.8, 0.1, 0.012, { x, z: z + 0.215, y: 0.3 });
  b.box(MC.red, 1.1, 0.04, 0.52, { x, z, y: 0.5, rx: 0.08 });
  b.box(MC.teal, 0.12, 0.12, 0.12, { x: x - 0.4, z, y: 0.58 });
  b.cone(MC.teal, 0.1, 0.14, 4, { x: x - 0.4, z, y: 0.64, ry: Math.PI / 4 });
}

/** White tension-fabric canopies over low stands. */
function addCanopies(b: ColorBatch): void {
  for (const [a0, a1] of [
    [2.5, 3.9],
    [5.5, 6.7]
  ] as const) {
    terrace(b, { a0, a1, gap: 0.05, width: 0.7, y0: 0.12, y1: 0.5, seat: 0xb8bec2, rows: 5 });
    roof(b, {
      a0,
      a1,
      gap: 0.2,
      width: 0.7,
      y: 0.78,
      rise: 0.12,
      color: MC.white,
      under: 0xc9ccd0,
      thick: 0.03
    });
    posts(b, MC.grey, 6, a0, a1, 1.85 + 0.9, 2.1 + 0.9, 0.78);
  }
}

export function addNewlands(b: ColorBatch): void {
  const bank = {
    gap: 0.05,
    width: 0.5,
    y0: 0.12,
    y1: 0.26,
    seat: 0x7ea558,
    side: 0x66904a,
    density: 0.3
  };
  terrace(b, { ...bank, a0: 0.1, a1: 2.4 });
  terrace(b, { ...bank, a0: 4.0, a1: 5.4 });
  addMountains(b);
  addPavilion(b);
  addCanopies(b);
  scoreboard(b, 2.5, -1.3, 0.8, 0.5);
  const p = arcPt(0.3, 1.1);
  floodlight(b, p.x, p.z, 2.3, 0.4);
  const q = arcPt(BACK + 1.9 + TAU, 1.0);
  floodlight(b, q.x, q.z, 2.3, 0.4);
  for (const [x, z, s] of [
    [0.3, -2.75, 1.5],
    [1.4, -2.7, 1.3],
    [-2.3, -2.4, 1.4],
    [2.7, 0.8, 1.2],
    [-2.9, 1.9, 1.3]
  ] as const) {
    tree(b, x, z, s, s > 1.3 ? 0x4d8a3c : MC.green);
  }
}
