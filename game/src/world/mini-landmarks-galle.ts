import type { ColorBatch } from './mini-batch';
import { MC, merlons, terrace, wall } from './mini-parts';

const FORT: Array<[number, number]> = [
  [-2.7, 2.0],
  [-2.85, 0.4],
  [-3.2, -0.9],
  [-2.6, -2.1],
  [-1.6, -2.85]
];

/** The Dutch fort ramparts: dark stone walls with merlons and a round sentry turret. */
function addFort(b: ColorBatch): void {
  for (let i = 0; i < FORT.length - 1; i++) {
    const [x0, z0] = FORT[i] ?? [0, 0];
    const [x1, z1] = FORT[i + 1] ?? [0, 0];
    wall(b, MC.stone, x0, z0, x1, z1, 0.42, 0.18);
    wall(b, 0x4a473f, x0, z0, x1, z1, 0.08, 0.26);
    const count = Math.max(3, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.2));
    merlons(b, 0x6d6a5f, x0, z0, x1, z1, 0.45, count);
  }
  const [tx, tz] = FORT[2] ?? [0, 0];
  b.cyl(MC.stone, 0.1, 0.09, 0.3, 8, { x: tx - 0.06, z: tz, y: 0.4 });
  b.cone(0x4a473f, 0.12, 0.12, 8, { x: tx - 0.06, z: tz, y: 0.7 });
  // Grassy slope in front of the walls.
  b.box(0x6a8f4a, 0.5, 0.1, 3.0, { x: -2.35, z: 0.2, y: 0.05, ry: -0.12 });
}

/** The sea strip behind the fort. */
function addSea(b: ColorBatch): void {
  b.box(MC.sea, 7.0, 0.04, 0.45, { x: 0, z: -3.28, y: 0.02 });
  for (let i = 0; i < 9; i++) {
    b.box(MC.white, 0.28, 0.012, 0.025, {
      x: -2.9 + i * 0.7 + (i % 2) * 0.2,
      z: -3.15 - (i % 3) * 0.08,
      y: 0.05
    });
  }
}

/** White three-storey pavilion with blue balconies and yellow stairs, plus the green-roofed stand. */
function addBuildings(b: ColorBatch): void {
  const px = 1.4;
  const pz = -2.45;
  b.box(MC.white, 1.3, 0.62, 0.42, { x: px, z: pz, y: 0.31 });
  b.box(MC.white, 0.5, 0.74, 0.44, { x: px, z: pz, y: 0.37 });
  for (const sx of [-1, 1]) {
    b.box(0xe9ecee, 0.42, 0.78, 0.44, { x: px + sx * 0.8, z: pz, y: 0.39 });
    for (let l = 0; l < 3; l++)
      b.box(MC.blue, 0.4, 0.035, 0.1, { x: px + sx * 0.8, z: pz + 0.26, y: 0.25 + l * 0.22 });
    b.box(MC.gold, 0.07, 0.3, 0.16, { x: px + sx * 0.52, z: pz + 0.22, y: 0.15, rx: -0.5 });
  }
  b.box(MC.glass, 1.0, 0.12, 0.012, { x: px, z: pz + 0.215, y: 0.3 });
  b.box(MC.grey, 1.35, 0.03, 0.5, { x: px, z: pz, y: 0.63 });
  // Long low stand along the west side with a green roof.
  b.box(MC.sandDark, 0.3, 0.28, 1.5, { x: -2.1, z: -1.5, y: 0.14 });
  b.box(0x4f7a4a, 0.55, 0.04, 1.6, { x: -2.15, z: -1.5, y: 0.34, rz: 0.1 });
  b.box(MC.brick, 0.5, 0.3, 0.5, { x: -0.7, z: -2.6, y: 0.15 });
  b.cone(MC.brickDark, 0.42, 0.2, 4, { x: -0.7, z: -2.6, y: 0.3, ry: Math.PI / 4 });
}

/** Palm tree: bent trunk and a fan of leaves. */
function addPalm(b: ColorBatch, x: number, z: number, s: number): void {
  b.cyl(0x8a6a44, 0.03 * s, 0.022 * s, 0.6 * s, 5, { x, z, rz: 0.12 });
  const cx = x - 0.07 * s;
  for (let i = 0; i < 6; i++) {
    b.box(MC.green, 0.04 * s, 0.01, 0.34 * s, {
      x: cx,
      z,
      y: 0.62 * s,
      ry: (i / 6) * Math.PI * 2,
      rx: 0.5
    });
  }
}

export function addGalle(b: ColorBatch): void {
  const bank = {
    gap: 0.05,
    width: 0.45,
    y0: 0.12,
    y1: 0.22,
    seat: 0x6f9a4c,
    side: 0x5a8040,
    density: 0.12
  };
  terrace(b, { ...bank, a0: 5.6, a1: 7.5 });
  terrace(b, { ...bank, a0: 0.9, a1: 2.3 });
  addFort(b);
  addSea(b);
  addBuildings(b);
  addPalm(b, 0.4, -2.9, 1.2);
  addPalm(b, -1.4, -3.0, 1);
  addPalm(b, 2.8, -1.4, 1.1);
  addPalm(b, 2.6, 1.4, 0.9);
}
