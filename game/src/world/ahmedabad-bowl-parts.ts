import * as THREE from 'three/webgpu';
import type { MergeBatch } from './merge-batch';
import {
  angleDiff,
  tierOuterR,
  tierTopY,
  type BowlLayout,
  type TierSpec
} from './ahmedabad-bowl-layout';

const TWO_PI = Math.PI * 2;
export const RING_SEGMENTS = 96;
export const AISLE_COUNT = 24;

export interface BowlMaterials {
  lowerSeats: THREE.Material;
  upperSeats: THREE.Material;
  band: THREE.Material;
  frontLip: THREE.Material;
  aisle: THREE.Material;
  white: THREE.Material;
  under: THREE.Material;
  rib: THREE.Material;
  glass: THREE.Material;
  apron: THREE.Material;
  dark: THREE.Material;
  blue: THREE.Material;
  boards: THREE.Material[];
  frame: THREE.Material;
}

/** A revolved 2-point (r, y) profile. Direction matters: normal = (dy, -dr) in the profile plane. */
export function lathePart(
  batch: MergeBatch,
  material: THREE.Material,
  points: Array<[number, number]>,
  gap?: { angle: number; half: number }
): void {
  const start = gap ? gap.angle + gap.half : 0;
  const length = gap ? TWO_PI - gap.half * 2 : TWO_PI;
  const segments = Math.max(4, Math.ceil((RING_SEGMENTS * length) / TWO_PI));
  const pts = points.map(([r, y]) => new THREE.Vector2(r, y));
  batch.add(material, new THREE.LatheGeometry(pts, segments, start, length), 0, 0, 0);
}

/** One tier as a single sloped ramp through the seat positions (texture draws the rows). */
export function addTier(
  batch: MergeBatch,
  tier: TierSpec,
  seats: THREE.Material,
  lip: THREE.Material,
  gap?: { angle: number; half: number }
): void {
  const slope = tier.rise / tier.run;
  const yIn = tier.y0 + tier.rise / 2;
  const rOut = tierOuterR(tier);
  const yOut = yIn + (rOut - tier.r0) * slope;
  lathePart(
    batch,
    seats,
    [
      [rOut, yOut],
      [tier.r0, yIn]
    ],
    gap
  );
  lathePart(
    batch,
    lip,
    [
      [tier.r0, yIn],
      [tier.r0, tier.y0]
    ],
    gap
  );
}

/** Angles of the stairway aisles, with the gate's gap left out. */
export function aisleAngles(layout: BowlLayout, count = AISLE_COUNT): number[] {
  const out: number[] = [];
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TWO_PI;
    if (Math.abs(angleDiff(a, layout.gateAngle)) > layout.gateHalf + 0.05) out.push(a);
  }
  return out;
}

/** Pale sloped stripes up the ramp: the stairways. */
export function addAisles(
  batch: MergeBatch,
  mat: THREE.Material,
  tier: TierSpec,
  angles: number[]
): void {
  const dr = tier.rows * tier.run;
  const dy = tier.rows * tier.rise;
  const length = Math.hypot(dr, dy);
  const pitch = Math.atan2(dy, dr);
  const rm = tier.r0 + dr / 2;
  const ym = tier.y0 + tier.rise / 2 + dy / 2 + 0.07;
  for (const a of angles) {
    const geo = new THREE.BoxGeometry(1.0, 0.1, length);
    geo.rotateX(-pitch);
    batch.add(mat, geo, Math.sin(a) * rm, ym, Math.cos(a) * rm, a);
  }
}

/** Apron, the corporate-box band (fascia, glass, ad strip), its roof deck and the rail. */
export function addConcourse(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { lower, upper, fasciaR, fasciaTopY } = layout;
  const deckY = tierTopY(lower);
  lathePart(batch, m.apron, [
    [layout.outerWallR, 0.03],
    [layout.wallR + 0.5, 0.03]
  ]);
  lathePart(batch, m.band, [
    [fasciaR, fasciaTopY],
    [fasciaR, deckY]
  ]);
  lathePart(batch, m.white, [
    [fasciaR, deckY],
    [tierOuterR(lower), deckY]
  ]);
  lathePart(batch, m.white, [
    [upper.r0, fasciaTopY],
    [fasciaR, fasciaTopY]
  ]);
  lathePart(batch, m.frame, [
    [tierOuterR(lower) - 0.1, deckY + 0.5],
    [tierOuterR(lower) - 0.1, deckY]
  ]);
}
