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
  riser: THREE.Material;
  lowerTread: THREE.Material;
  upperTread: THREE.Material;
  aisle: THREE.Material;
  concrete: THREE.Material;
  roofTop: THREE.Material;
  roofUnder: THREE.Material;
  roofLip: THREE.Material;
  dark: THREE.Material;
  trim: THREE.Material;
  screen: THREE.Material;
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

/** One tier of stepped seat rows: inward-facing risers and upward-facing treads. */
export function addTier(
  batch: MergeBatch,
  tier: TierSpec,
  riser: THREE.Material,
  tread: THREE.Material,
  gap?: { angle: number; half: number }
): void {
  for (let i = 0; i < tier.rows; i++) {
    const r = tier.r0 + i * tier.run;
    const y = tier.y0 + (i + 1) * tier.rise;
    lathePart(
      batch,
      riser,
      [
        [r, y],
        [r, y - tier.rise]
      ],
      gap
    );
    lathePart(
      batch,
      tread,
      [
        [r + tier.run, y],
        [r, y]
      ],
      gap
    );
  }
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

/** Dark sloped stripes running up the tier from nose to nose: the stairways. */
export function addAisles(
  batch: MergeBatch,
  mat: THREE.Material,
  tier: TierSpec,
  angles: number[]
): void {
  const dr = tier.rows * tier.run;
  const dy = tier.rows * tier.rise - tier.rise;
  const length = Math.hypot(dr, dy);
  const pitch = Math.atan2(dy, dr);
  const rm = tier.r0 + dr / 2;
  const ym = tier.y0 + tier.rise + dy / 2 + 0.06;
  for (const a of angles) {
    const geo = new THREE.BoxGeometry(1.1, 0.1, length);
    geo.rotateX(-pitch);
    batch.add(mat, geo, Math.sin(a) * rm, ym, Math.cos(a) * rm, a);
  }
}

/** Concrete apron under the stands, concourse deck, upper-tier fascia with vomitory doors. */
export function addConcourse(batch: MergeBatch, m: BowlMaterials, layout: BowlLayout): void {
  const { lower, fasciaR, fasciaTopY } = layout;
  const deckY = tierTopY(lower);
  lathePart(batch, m.concrete, [
    [layout.backWallR, 0.03],
    [layout.wallR + 0.5, 0.03]
  ]);
  lathePart(batch, m.trim, [
    [fasciaR, deckY],
    [tierOuterR(lower), deckY]
  ]);
  lathePart(batch, m.trim, [
    [fasciaR, fasciaTopY],
    [fasciaR, deckY]
  ]);
  for (const a of aisleAngles(layout)) {
    batch.box(
      m.dark,
      1.8,
      1.7,
      0.25,
      Math.sin(a) * (fasciaR - 0.1),
      deckY + 0.85,
      Math.cos(a) * (fasciaR - 0.1),
      a
    );
  }
  // A timber rail on the deck's lower-tier edge.
  lathePart(batch, m.frame, [
    [tierOuterR(lower) + 0.25, deckY + 0.9],
    [tierOuterR(lower) + 0.25, deckY]
  ]);
}
