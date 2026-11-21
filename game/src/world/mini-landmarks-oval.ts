import type { ColorBatch } from './mini-batch';
import { addBand, flatColor } from './mini-bands';
import { createGableGeometry } from './merge-batch';
import { BACK, MC, TAU, arcPt, floodlight, roof, terrace } from './mini-parts';

const TEAL = 0x3fa7a0;
const IRON = 0x56624f;
const PAV_Z = -2.55;
const GAS = { x: -1.45, z: -2.85, r: 0.62, h: 1.5 };

/** The gasholder: a round iron cage, columns, rings and cross bracing. */
function addGasholder(b: ColorBatch): void {
  const cols = 12;
  for (let i = 0; i < cols; i++) {
    const a = (i / cols) * TAU;
    b.cyl(IRON, 0.022, 0.022, GAS.h, 4, {
      x: GAS.x + Math.cos(a) * GAS.r,
      z: GAS.z + Math.sin(a) * GAS.r
    });
    const a2 = ((i + 1) / cols) * TAU;
    const x0 = Math.cos(a) * GAS.r;
    const z0 = Math.sin(a) * GAS.r;
    const x1 = Math.cos(a2) * GAS.r;
    const z1 = Math.sin(a2) * GAS.r;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    for (let lvl = 0; lvl < 2; lvl++) {
      const sign = (i + lvl) % 2 === 0 ? 1 : -1;
      const diag = Math.hypot(len, GAS.h / 2);
      b.box(IRON, 0.012, 0.012, diag, {
        x: GAS.x + (x0 + x1) / 2,
        z: GAS.z + (z0 + z1) / 2,
        y: (lvl + 0.5) * (GAS.h / 2),
        ry: yaw,
        rx: sign * Math.atan2(GAS.h / 2, len)
      });
    }
  }
  for (const y of [0.02, GAS.h / 2, GAS.h - 0.02]) {
    addBand(
      b,
      {
        a0: 0,
        a1: TAU,
        rxIn: GAS.r - 0.02,
        rzIn: GAS.r - 0.02,
        rxOut: GAS.r + 0.02,
        rzOut: GAS.r + 0.02,
        yIn: y,
        yOut: y,
        thick: 0.025,
        segs: 12,
        color: flatColor(IRON)
      },
      0,
      GAS.x,
      GAS.z
    );
  }
}

/** Red-brick pavilion with a gabled slate roof, dormers and a corner turret. */
function addPavilion(b: ColorBatch): void {
  const x = 0.5;
  b.box(MC.brick, 1.5, 0.46, 0.48, { x, z: PAV_Z, y: 0.31 });
  b.box(MC.white, 1.56, 0.03, 0.56, { x, z: PAV_Z + 0.04, y: 0.3 });
  for (let i = 0; i < 6; i++) {
    b.box(MC.glass, 0.1, 0.16, 0.012, { x: x - 0.55 + i * 0.22, z: PAV_Z + 0.245, y: 0.2 });
    b.box(MC.glass, 0.1, 0.16, 0.012, { x: x - 0.55 + i * 0.22, z: PAV_Z + 0.245, y: 0.44 });
  }
  b.add(0x4a4e57, createGableGeometry(1.6, 0.62, 0.3), { x, z: PAV_Z, y: 0.54 });
  for (const dx of [-0.35, 0.35]) {
    b.box(MC.brick, 0.16, 0.14, 0.14, { x: x + dx, z: PAV_Z + 0.12, y: 0.74 });
    b.cone(0x4a4e57, 0.13, 0.12, 4, { x: x + dx, z: PAV_Z + 0.12, y: 0.81, ry: Math.PI / 4 });
  }
  b.box(MC.brick, 0.2, 0.34, 0.2, { x: x + 0.72, z: PAV_Z, y: 0.7 });
  b.cone(0x4a4e57, 0.18, 0.22, 4, { x: x + 0.72, z: PAV_Z, y: 0.87, ry: Math.PI / 4 });
  b.cyl(MC.gold, 0.01, 0.01, 0.12, 4, { x: x + 0.72, z: PAV_Z, y: 1.08 });
}

/** A modern white stand beside the pavilion with a sloping roof. */
function addWhiteStand(b: ColorBatch): void {
  b.box(MC.white, 0.95, 0.42, 0.3, { x: 1.9, z: -2.5, y: 0.31 });
  b.box(MC.glass, 0.85, 0.12, 0.012, { x: 1.9, z: -2.34, y: 0.36 });
  b.box(MC.grey, 1.0, 0.03, 0.55, { x: 1.9, z: -2.5, y: 0.66, rx: -0.12 });
  b.box(MC.white, 0.3, 0.7, 0.22, { x: 2.5, z: -2.55, y: 0.35 });
}

/** A short row of brick terraced houses behind the east stands. */
function addHouses(b: ColorBatch): void {
  for (let i = 0; i < 6; i++) {
    const x = 0.9 + i * 0.4;
    const col = i % 2 === 0 ? MC.brick : 0xb5694a;
    b.box(col, 0.36, 0.26, 0.22, { x, z: -3.2, y: 0.13 });
    b.box(0x4a4e57, 0.38, 0.05, 0.26, { x, z: -3.2, y: 0.28 });
  }
}

export function addOval(b: ColorBatch): void {
  const ring = {
    gap: 0.05,
    width: 0.5,
    y0: 0.12,
    y1: 0.36,
    seat: TEAL,
    side: 0x8aa8a4,
    density: 0.3
  };
  terrace(b, { ...ring, a0: BACK + 0.7, a1: BACK - 0.7 + TAU });
  for (const [a0, a1] of [
    [5.4, 7.0],
    [2.3, 3.9]
  ] as const) {
    terrace(b, { a0, a1, gap: 0.55, width: 0.4, y0: 0.4, y1: 0.7, seat: TEAL, side: 0x8aa8a4 });
    roof(b, { a0, a1, gap: 0.4, width: 0.6, y: 0.95, rise: 0.08, color: MC.white, under: MC.grey });
  }
  addPavilion(b);
  addWhiteStand(b);
  addGasholder(b);
  addHouses(b);
  const p = arcPt(0.6, 0.9);
  floodlight(b, p.x, p.z, 1.9, 0.38, MC.grey);
  const q = arcPt(2.5, 0.9);
  floodlight(b, q.x, q.z, 1.9, 0.38, MC.grey);
}
