import type { ColorBatch } from './mini-batch';
import { createGableGeometry } from './merge-batch';
import * as THREE from 'three/webgpu';
import {
  BACK,
  MC,
  TAU,
  arcPt,
  floodlight,
  mountain,
  pine,
  scoreboard,
  terrace
} from './mini-parts';

const PINK_ROOF = 0xc2504a;
const SEATS = [0x3f8f6a, 0xe0b83a, 0x3e6fa3, 0xd98a9a];

/** The snow-capped Dhauladhar range with green foothills and pines. */
function addMountains(b: ColorBatch): void {
  const peaks: Array<[number, number, number, number]> = [
    [-2.7, 1.5, 0.95, 0.35],
    [-1.6, 2.0, 1.0, 0.45],
    [-0.3, 2.35, 1.1, 0.5],
    [1.0, 2.1, 1.05, 0.5],
    [2.2, 1.75, 1.0, 0.4],
    [3.0, 1.2, 0.8, 0.3]
  ];
  peaks.forEach(([x, h, r, snow], i) => mountain(b, x, -3.05, r, h, 0x5d6f68, snow, i + 1));
  for (let i = 0; i < 5; i++)
    mountain(b, -2.8 + i * 1.35, -2.6, 0.7, 0.8 + (i % 2) * 0.25, 0x4f7a4a, 0, i + 20);
  for (const [x, z, s] of [
    [-2.4, -2.2, 1.3],
    [-1.9, -2.35, 1.1],
    [1.8, -2.3, 1.2],
    [2.5, -2.0, 1.4],
    [0.9, -2.85, 1.0],
    [-0.8, -2.9, 1.1]
  ] as const) {
    pine(b, x, z, s);
  }
}

/** The pagoda-style pavilion: stacked red roofs with golden finials. */
function addPavilion(b: ColorBatch): void {
  const z = -2.4;
  const k = 1.45;
  b.box(MC.cream, 1.3, 0.3, 0.55, { z, y: 0.25 });
  b.box(MC.glass, 1.1, 0.14, 0.012, { z: z + 0.28, y: 0.27 });
  b.cone(PINK_ROOF, 0.62 * k, 0.24 * k, 4, { z, y: 0.4, ry: Math.PI / 4, sx: 1.1 });
  b.cone(PINK_ROOF, 0.34 * k, 0.24 * k, 4, { z, y: 0.4 + 0.2 * k, ry: Math.PI / 4 });
  b.cone(PINK_ROOF, 0.2 * k, 0.2 * k, 4, { z, y: 0.4 + 0.42 * k, ry: Math.PI / 4 });
  b.cyl(MC.gold, 0.015, 0.015, 0.16, 4, { z, y: 0.4 + 0.6 * k });
  for (const sx of [-1, 1]) {
    b.cone(PINK_ROOF, 0.22, 0.2, 4, { x: sx * 0.72, z, y: 0.4, ry: Math.PI / 4 });
    b.add(MC.gold, new THREE.SphereGeometry(0.07, 6, 4), { x: sx * 0.72, z, y: 0.6 });
  }
}

/** A second, two-storey block with a red gabled roof. */
function addSideBlock(b: ColorBatch): void {
  b.box(MC.cream, 0.9, 0.3, 0.36, { x: 2.0, z: -1.5, y: 0.25, ry: -0.5 });
  b.add(PINK_ROOF, createGableGeometry(1.0, 0.5, 0.22), { x: 2.0, z: -1.5, y: 0.4, ry: -0.5 });
}

export function addDharamsala(b: ColorBatch): void {
  const stripe = (k: number): number => SEATS[Math.floor(k / 3) % SEATS.length] ?? MC.green;
  const colorFn = (k: number, _row: number, face: string): number => {
    const c = stripe(k);
    return face === 'top' ? c : new THREE.Color(c).multiplyScalar(0.6).getHex();
  };
  terrace(b, {
    a0: BACK + 0.55,
    a1: BACK - 0.55 + TAU,
    gap: 0.05,
    width: 0.45,
    y0: 0.12,
    y1: 0.3,
    seat: MC.green,
    segs: 36,
    rows: 3,
    colorFn
  });
  addMountains(b);
  addPavilion(b);
  addSideBlock(b);
  scoreboard(b, -2.3, -1.5, 0.7, 0.45);
  const p = arcPt(0.2, 0.9);
  floodlight(b, p.x, p.z, 1.9, 0.34, MC.grey);
  const q = arcPt(3.0, 0.9);
  floodlight(b, q.x, q.z, 1.9, 0.34, MC.grey);
}
