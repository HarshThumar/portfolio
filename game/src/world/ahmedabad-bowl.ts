import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import { PALETTE, type SharedMaterials } from './palette';
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
const LOWER_ROWS = [2, 7, 12];
const UPPER_ROWS = [2, 8, 13];

function createOwnMaterials(shared: SharedMaterials): {
  mats: BowlMaterials;
  flood: THREE.MeshBasicMaterial;
  dispose: () => void;
} {
  const owned: THREE.Material[] = [];
  const lambert = (color: number): THREE.MeshLambertMaterial => {
    const m = new THREE.MeshLambertMaterial({ color });
    owned.push(m);
    return m;
  };
  const flood = new THREE.MeshBasicMaterial({ color: PALETTE.flood });
  const mats: BowlMaterials = {
    riser: shared.cream,
    lowerTread: shared.leather,
    upperTread: shared.outfield2,
    aisle: lambert(0x3d2c1b),
    concrete: lambert(0xe4d8b8),
    roofTop: shared.cream,
    roofUnder: shared.willow,
    roofLip: lambert(0xd9c9a0),
    dark: shared.ink,
    trim: shared.cream,
    screen: lambert(0xf7f4ea),
    boards: [shared.leather, shared.cream, shared.willow, shared.outfield],
    frame: shared.timber
  };
  return {
    mats,
    flood,
    dispose: () => {
      for (const m of owned) m.dispose();
      flood.dispose();
    }
  };
}

function rowsToRings(
  tier: TierSpec,
  rows: number[],
  rope: number
): Array<{ r: number; offset: number; y: number }> {
  return rows.map((i) => {
    const r = tier.r0 + i * tier.run + tier.run / 2;
    return { r, offset: r - rope, y: tier.y0 + (i + 1) * tier.rise };
  });
}

/** Seat rings with counts proportional to circumference, summing to TOTAL_SEATED. */
function buildSeatRings(layout: BowlLayout): SeatRing[] {
  const rings = [
    ...rowsToRings(layout.lower, LOWER_ROWS, layout.rope),
    ...rowsToRings(layout.upper, UPPER_ROWS, layout.rope)
  ];
  const sumR = rings.reduce((s, r) => s + r.r, 0);
  const out = rings.map((r) => ({
    offset: r.offset,
    y: r.y,
    count: Math.round((r.r / sumR) * TOTAL_SEATED)
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
  const own = createOwnMaterials(materials);
  const batch = createMergeBatch();
  const gap = { angle: layout.gateAngle, half: layout.gateHalf };

  addTier(batch, layout.lower, own.mats.riser, own.mats.lowerTread, gap);
  addTier(batch, layout.upper, own.mats.riser, own.mats.upperTread);
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
