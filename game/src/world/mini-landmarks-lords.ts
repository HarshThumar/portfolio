import * as THREE from 'three/webgpu';
import type { ColorBatch } from './mini-batch';
import { BACK, FRONT, MC, TAU, arcPt, flag, roof, terrace, tent } from './mini-parts';

const PAV_Z = -2.55;
const SLATE = 0x3e434b;

/** Red-brick Victorian Pavilion with white balconies, two end cupolas and a dark roof. */
function addPavilion(b: ColorBatch): void {
  const y = 0.08;
  b.box(MC.brick, 1.9, 0.28, 0.5, { z: PAV_Z, y: y + 0.14 });
  b.box(MC.white, 1.98, 0.03, 0.6, { z: PAV_Z + 0.04, y: y + 0.295 });
  b.box(MC.brick, 1.9, 0.26, 0.5, { z: PAV_Z, y: y + 0.43 });
  b.box(MC.white, 1.98, 0.03, 0.6, { z: PAV_Z + 0.04, y: y + 0.575 });
  b.box(MC.glass, 1.5, 0.14, 0.4, { z: PAV_Z + 0.02, y: y + 0.66 });
  b.box(SLATE, 1.7, 0.035, 0.56, { z: PAV_Z, y: y + 0.76 });
  const fz = PAV_Z + 0.255;
  for (let i = 0; i < 8; i++) {
    const x = -0.78 + i * 0.223;
    b.box(MC.glass, 0.09, 0.15, 0.012, { x, z: fz, y: y + 0.14 });
    b.box(MC.glass, 0.09, 0.15, 0.012, { x, z: fz, y: y + 0.43 });
    b.box(MC.white, 0.014, 0.1, 0.014, { x: x + 0.11, z: PAV_Z + 0.34, y: y + 0.66 });
  }
  b.box(MC.white, 1.9, 0.03, 0.012, { z: PAV_Z + 0.34, y: y + 0.325 });
  b.box(MC.white, 1.9, 0.03, 0.012, { z: PAV_Z + 0.34, y: y + 0.605 });
  // Left end: pyramid-roofed cupola. Right end: domed pinnacle with a finial.
  b.box(MC.brick, 0.26, 0.2, 0.34, { x: -0.86, z: PAV_Z, y: y + 0.86 });
  b.cone(SLATE, 0.24, 0.2, 4, { x: -0.86, z: PAV_Z, y: y + 0.96, ry: Math.PI / 4 });
  b.box(MC.brick, 0.26, 0.2, 0.34, { x: 0.86, z: PAV_Z, y: y + 0.86 });
  b.add(MC.white, new THREE.SphereGeometry(0.14, 8, 5, 0, TAU, 0, Math.PI / 2), {
    x: 0.86,
    z: PAV_Z,
    y: y + 0.96
  });
  b.cyl(MC.gold, 0.012, 0.012, 0.1, 4, { x: 0.86, z: PAV_Z, y: y + 1.1 });
  b.cyl(MC.white, 0.01, 0.01, 0.5, 4, { x: -0.5, z: PAV_Z, y: y + 0.78 });
  flag(b, -0.5, y + 0.78, PAV_Z, 0.5, MC.gold);
}

/** White Grand Stand with its tilted cantilever roof and a mast. */
function addGrandStand(b: ColorBatch): void {
  terrace(b, {
    a0: BACK - 1.45,
    a1: BACK - 0.6,
    gap: 0.05,
    width: 0.7,
    y0: 0.12,
    y1: 0.55,
    seat: 0xe6e3da,
    rows: 5,
    density: 0.3
  });
  roof(b, {
    a0: BACK - 1.45,
    a1: BACK - 0.6,
    gap: 0.05,
    width: 0.95,
    y: 0.82,
    rise: 0.1,
    color: MC.white,
    under: MC.greyDark
  });
  const m = arcPt(BACK - 1.0, 0.95);
  b.cyl(MC.white, 0.015, 0.012, 0.9, 4, { x: m.x, z: m.z, y: 0.2 });
}

/** The aluminium Media Centre: a white pod raised on two legs. */
function addMediaCentre(b: ColorBatch): void {
  const z = 2.5;
  for (const x of [-0.22, 0.22]) b.cyl(MC.grey, 0.07, 0.05, 0.58, 6, { x, z, y: 0.1 });
  b.add(MC.white, new THREE.SphereGeometry(1, 12, 7), { z, y: 0.8, sx: 0.6, sy: 0.15, sz: 0.22 });
  b.box(MC.glass, 0.78, 0.05, 0.02, { z: z - 0.21, y: 0.81, rx: 0.05 });
}

/** Mound Stand: a raised bank under a row of white peaked tents. */
function addMoundStand(b: ColorBatch): void {
  const a0 = 5.75;
  const a1 = 6.75;
  terrace(b, { a0, a1, gap: 0.55, width: 0.4, y0: 0.36, y1: 0.62, seat: 0xe6e3da, rows: 3 });
  for (let i = 0; i < 5; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / 5;
    const p = arcPt(a, 0.78);
    tent(b, p.x, 0.6, p.z, 0.2, 0.26, MC.white);
  }
}

export function addLords(b: ColorBatch): void {
  const white = 0xe6e3da;
  const low = { gap: 0.05, width: 0.5, y0: 0.12, y1: 0.36, seat: white, density: 0.3 };
  terrace(b, { ...low, a0: BACK + 0.6, a1: TAU + FRONT - 0.45 });
  terrace(b, { ...low, a0: FRONT + 0.45, a1: BACK - 1.45 });
  addPavilion(b);
  addGrandStand(b);
  addMediaCentre(b);
  addMoundStand(b);
}
