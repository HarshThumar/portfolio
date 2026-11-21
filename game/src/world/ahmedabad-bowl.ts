import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';
import { createMergeBatch } from './merge-batch';
import type { FieldShape } from './field-shape';
import { createLayout, type BowlLayout, type TierSpec } from './ahmedabad-bowl-layout';
import {
  AISLE_COUNT,
  addAisles,
  addConcourse,
  addTier,
  aisleAngles,
  type BowlMaterials
} from './ahmedabad-bowl-parts';
import {
  createBandTexture,
  createLowerSeatTexture,
  createUpperSeatTexture
} from './ahmedabad-bowl-textures';
import { addRoof, createFloodlights } from './ahmedabad-bowl-roof';
import { addBoards, addEdgeColliders, addGate, addSightScreens } from './ahmedabad-bowl-edge';

interface SeatRing {
  /** Metres beyond the rope. */
  offset: number;
  /** Seat height (top of the tread). */
  y: number;
  count: number;
}

export interface AhmedabadBowl {
  group: THREE.Group;
  seatRings: SeatRing[];
  dispose: () => void;
}

const TOTAL_SEATED = 2600;
const LOWER_ROWS = [2, 6, 10];
const UPPER_ROWS = [3, 9, 15];
const LOWER_WEIGHT = 1.4;
const UPPER_REPEAT = 14;
const BAND_REPEAT = 60;
const LOWER_REPEAT = 360;

function createOwnMaterials(
  shared: SharedMaterials,
  layout: BowlLayout
): { mats: BowlMaterials; flood: THREE.MeshBasicMaterial; dispose: () => void } {
  const owned: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    owned.push(item);
    return item;
  };
  const lambert = (color: number): THREE.MeshLambertMaterial =>
    track(new THREE.MeshLambertMaterial({ color }));
  const textured = (map: THREE.CanvasTexture): THREE.MeshLambertMaterial =>
    track(new THREE.MeshLambertMaterial({ map: track(map) }));
  const flood = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const mats: BowlMaterials = {
    lowerSeats: textured(createLowerSeatTexture(layout.lower.rows, LOWER_REPEAT)),
    upperSeats: textured(createUpperSeatTexture(layout.upper.rows, UPPER_REPEAT)),
    band: textured(createBandTexture(BAND_REPEAT)),
    frontLip: lambert(0xc23f1a),
    aisle: lambert(0xe9dfc6),
    white: lambert(0xf6f2e6),
    under: lambert(0xe6dfca),
    rib: lambert(0xb4ad98),
    glass: lambert(0x56697b),
    apron: lambert(0xe0d6bc),
    dark: lambert(0x141a20),
    blue: lambert(0x24409a),
    boards: [shared.leather, shared.willow, lambert(0x24409a), shared.cream],
    frame: shared.timber
  };
  return { mats, flood, dispose: () => owned.forEach((o) => o.dispose()) };
}

function rowsToRings(
  tier: TierSpec,
  rows: number[],
  rope: number,
  weight: number
): Array<{ w: number; offset: number; y: number }> {
  return rows.map((i) => {
    const r = tier.r0 + i * tier.run + tier.run / 2;
    return { w: r * weight, offset: r - rope, y: tier.y0 + (i + 1) * tier.rise };
  });
}

/** Seat rings with counts proportional to circumference, summing to TOTAL_SEATED. */
function buildSeatRings(layout: BowlLayout): SeatRing[] {
  const rings = [
    ...rowsToRings(layout.lower, LOWER_ROWS, layout.rope, LOWER_WEIGHT),
    ...rowsToRings(layout.upper, UPPER_ROWS, layout.rope, 1)
  ];
  const sumW = rings.reduce((s, r) => s + r.w, 0);
  const out = rings.map((r) => ({
    offset: r.offset,
    y: r.y,
    count: Math.round((r.w / sumW) * TOTAL_SEATED)
  }));
  const last = out[out.length - 1];
  if (last) last.count += TOTAL_SEATED - out.reduce((s, r) => s + r.count, 0);
  return out;
}

/** Narendra Modi Stadium as a handmade miniature: round bowl, two tiers, roof ring of lamps. */
export function createAhmedabadBowl(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  field: FieldShape
): AhmedabadBowl {
  const layout = createLayout(field.rx);
  const own = createOwnMaterials(materials, layout);
  const batch = createMergeBatch();
  const gap = { angle: layout.gateAngle, half: layout.gateHalf };

  addTier(batch, layout.lower, own.mats.lowerSeats, own.mats.frontLip, gap);
  addTier(batch, layout.upper, own.mats.upperSeats, own.mats.white);
  const angles = aisleAngles(layout, AISLE_COUNT);
  addAisles(batch, own.mats.aisle, layout.lower, angles);
  addAisles(batch, own.mats.aisle, layout.upper, angles);
  addConcourse(batch, own.mats, layout);
  addRoof(batch, own.mats, layout);
  addBoards(batch, own.mats, layout);
  addSightScreens(batch, own.mats, layout);
  addGate(batch, own.mats, layout);
  const built = batch.build();

  const lamps = createFloodlights(layout, own.flood);
  const group = new THREE.Group();
  group.name = 'ahmedabad-bowl';
  group.add(built.group, lamps.mesh);
  scene.add(group);

  const removeColliders = addEdgeColliders(world, rapier, layout);

  return {
    group,
    seatRings: buildSeatRings(layout),
    dispose: () => {
      scene.remove(group);
      built.dispose();
      lamps.dispose();
      own.dispose();
      removeColliders();
    }
  };
}
