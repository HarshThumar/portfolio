import * as THREE from 'three/webgpu';
import type { ColorBatch } from './mini-batch';
import { addBand, hash2, type BandFace, type BandOpts } from './mini-bands';

/** Oval half-axes shared by every miniature (the turf and the first terrace ring). */
export const RX = 1.85;
export const RZ = 2.1;
/** Top of the grass above the plinth. */
export const TURF_Y = 0.1;
export const TAU = Math.PI * 2;
/** Angle of the far side (away from the hub) and of the near side. */
export const BACK = Math.PI * 1.5;
export const FRONT = Math.PI / 2;

/** Painted colours used by the miniatures (muted, handmade). */
export const MC = {
  white: 0xe9e6dc,
  cream: 0xf3ead3,
  brick: 0xa4472f,
  brickDark: 0x7d3524,
  slate: 0x4b4f58,
  ironGreen: 0x4a5a4e,
  grey: 0x8a8f96,
  greyDark: 0x5a6068,
  steel: 0x56687a,
  sand: 0xd2b98b,
  sandDark: 0xb89c6a,
  red: 0xb23a2e,
  gold: 0xd9a93a,
  ink: 0x2a2620,
  glass: 0x9bb3c2,
  teal: 0x5aa9a0,
  blue: 0x3e6fa3,
  green: 0x4f8a4a,
  darkGreen: 0x2f5a35,
  rock: 0x6f655a,
  snow: 0xf2f4f6,
  sea: 0x4f95a8,
  stone: 0x5e5b52
} as const;

const CROWD = [0xb8483a, 0xe0c46a, 0x4f7fa8, 0xf0ebe0, 0x6f9a63, 0xcf8a4e, 0x8a6e9c];

/** Colour callback for a seating band: rows of seat colour with a scatter of crowd dots. */
function crowdColor(
  seat: number,
  density = 0.4,
  side = new THREE.Color(seat).multiplyScalar(0.55).getHex()
): BandOpts['color'] {
  const seatColor = new THREE.Color(seat);
  const dots = CROWD.map((c) => seatColor.clone().lerp(new THREE.Color(c), 0.6).getHex());
  return (k: number, row: number, face: BandFace): number => {
    if (face !== 'top') return side;
    if (hash2(k, row + 3) > density * 0.4) return seat;
    return dots[Math.floor(hash2(row, k) * dots.length) % dots.length] ?? seat;
  };
}

export interface TerraceOpts {
  a0: number;
  a1: number;
  /** Gap from the turf edge and width of the terrace. */
  gap: number;
  width: number;
  y0: number;
  y1: number;
  seat: number;
  segs?: number;
  rows?: number;
  density?: number;
  /** Colour of the walls (concrete); defaults to a dark seat tone. */
  side?: number;
  /** Replaces the crowd colouring completely. */
  colorFn?: BandOpts['color'];
}

/** Point on the ring at angle a, `d` outside the turf edge. */
export function arcPt(a: number, d: number): { x: number; z: number } {
  return { x: Math.cos(a) * (RX + d), z: Math.sin(a) * (RZ + d) };
}

/** A solid sloped terrace of seats around the oval. */
export function terrace(b: ColorBatch, o: TerraceOpts): void {
  const full = Math.abs(o.a1 - o.a0) >= TAU - 1e-6;
  addBand(b, {
    a0: o.a0,
    a1: o.a1,
    rxIn: RX + o.gap,
    rzIn: RZ + o.gap,
    rxOut: RX + o.gap + o.width,
    rzOut: RZ + o.gap + o.width,
    yIn: o.y0,
    yOut: o.y1,
    thick: o.y1 + (full ? 0 : 0.05),
    segs: o.segs ?? Math.max(8, Math.round(((o.a1 - o.a0) / TAU) * 40)),
    rows: o.rows ?? 4,
    solid: true,
    color: o.colorFn ?? crowdColor(o.seat, o.density, o.side)
  });
}

export interface RoofOpts {
  a0: number;
  a1: number;
  gap: number;
  width: number;
  y: number;
  /** Rise of the outer edge over the inner edge (negative tilts it down). */
  rise?: number;
  thick?: number;
  color: number;
  under?: number;
  segs?: number;
  wave?: (a: number) => number;
}

/** A thin roof slab over an arc (cantilever canopy, tent roof ring). */
export function roof(b: ColorBatch, o: RoofOpts): void {
  const under = o.under ?? o.color;
  addBand(b, {
    a0: o.a0,
    a1: o.a1,
    rxIn: RX + o.gap,
    rzIn: RZ + o.gap,
    rxOut: RX + o.gap + o.width,
    rzOut: RZ + o.gap + o.width,
    yIn: o.y,
    yOut: o.y + (o.rise ?? 0),
    thick: o.thick ?? 0.05,
    segs: o.segs ?? Math.max(8, Math.round(((o.a1 - o.a0) / TAU) * 40)),
    wave: o.wave,
    color: (_k, _r, face) => (face === 'bottom' ? under : o.color)
  });
}

/** Vertical posts along an ellipse (roof supports, masts). */
export function posts(
  b: ColorBatch,
  color: number,
  count: number,
  a0: number,
  a1: number,
  rx: number,
  rz: number,
  h: number,
  r = 0.018
): void {
  for (let i = 0; i < count; i++) {
    const a = a0 + ((a1 - a0) * i) / Math.max(1, count - 1);
    b.cyl(color, r, r, h, 4, { x: Math.cos(a) * rx, z: Math.sin(a) * rz });
  }
}

/** A floodlight: slim pole with a rectangular lamp head turned toward the oval. */
export function floodlight(
  b: ColorBatch,
  x: number,
  z: number,
  h: number,
  head = 0.34,
  pole: number = MC.white
): void {
  const yaw = Math.atan2(-x, -z);
  b.cyl(pole, 0.035, 0.022, h, 6, { x, z });
  b.box(0xa3a9ae, head, head * 0.8, 0.05, { x, z, y: h + head * 0.3, ry: yaw, rx: -0.15 });
  b.box(MC.cream, head * 0.88, head * 0.68, 0.02, {
    x: x + Math.sin(yaw) * 0.03,
    z: z + Math.cos(yaw) * 0.03,
    y: h + head * 0.3,
    ry: yaw,
    rx: -0.15
  });
}

/** Round tree: trunk and two stacked leaf blobs. */
export function tree(
  b: ColorBatch,
  x: number,
  z: number,
  s: number,
  leaf: number = MC.green
): void {
  b.cyl(MC.brickDark, 0.03 * s, 0.045 * s, 0.22 * s, 5, { x, z });
  b.add(leaf, new THREE.IcosahedronGeometry(0.2 * s, 0), { x, z, y: 0.34 * s, sy: 0.85 });
  b.add(leaf, new THREE.IcosahedronGeometry(0.14 * s, 0), {
    x: x + 0.05 * s,
    z: z - 0.03 * s,
    y: 0.5 * s
  });
}

/** Pointed pine: two stacked cones. */
export function pine(b: ColorBatch, x: number, z: number, s: number): void {
  b.cyl(MC.brickDark, 0.02 * s, 0.025 * s, 0.1 * s, 4, { x, z });
  b.cone(MC.darkGreen, 0.14 * s, 0.3 * s, 6, { x, z, y: 0.08 * s });
  b.cone(MC.darkGreen, 0.1 * s, 0.26 * s, 6, { x, z, y: 0.24 * s });
}

/** A four-sided tent roof. */
export function tent(
  b: ColorBatch,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  c: number,
  ry = 0
): void {
  b.cone(c, r, h, 4, { x, y, z, ry: ry + Math.PI / 4 });
}

/** Mountain: a faceted cone, optionally with a snow cap that follows the slope. */
export function mountain(
  b: ColorBatch,
  x: number,
  z: number,
  r: number,
  h: number,
  color: number,
  snow = 0,
  seed = 0
): void {
  const sx = 1 + hash2(seed, 1) * 0.3;
  const ry = hash2(seed, 2) * 3;
  b.cone(color, r, h, 6, { x, z, ry, sx, sz: 1 });
  if (snow <= 0) return;
  const capH = h * snow;
  b.cone(MC.snow, r * snow * 1.02, capH, 6, { x, z, ry, sx, y: h - capH });
}

/** A scoreboard: dark panel on two legs. */
export function scoreboard(b: ColorBatch, x: number, z: number, w: number, h: number): void {
  const yaw = Math.atan2(-x, -z);
  b.box(MC.ink, w, h, 0.08, { x, z, y: h / 2 + 0.2, ry: yaw });
  b.box(MC.cream, w * 0.9, h * 0.12, 0.09, { x, z, y: h * 0.8 + 0.2, ry: yaw });
  for (const s of [-1, 1]) {
    const px = x + Math.cos(yaw) * s * w * 0.35;
    const pz = z - Math.sin(yaw) * s * w * 0.35;
    b.cyl(MC.greyDark, 0.02, 0.02, 0.2, 4, { x: px, z: pz });
  }
}

/** A small flagpole with a flag. */
export function flag(b: ColorBatch, x: number, y: number, z: number, h: number, c: number): void {
  b.cyl(MC.white, 0.012, 0.012, h, 4, { x, y, z });
  b.box(c, 0.14, 0.08, 0.01, { x: x + 0.07, y: y + h - 0.05, z });
}

/** A row of small crenellations along a straight wall (merlons). */
export function merlons(
  b: ColorBatch,
  color: number,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  count: number
): void {
  const yaw = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    b.box(color, 0.08, 0.07, 0.07, { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, y, ry: yaw });
  }
}

/** A straight wall slab from (x0,z0) to (x1,z1), base at y = 0. */
export function wall(
  b: ColorBatch,
  color: number,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  h: number,
  thick: number
): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(x1 - x0, z1 - z0);
  b.box(color, thick, h, len, { x: (x0 + x1) / 2, z: (z0 + z1) / 2, y: h / 2, ry: yaw });
}
