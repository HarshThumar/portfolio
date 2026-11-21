import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { GameState, GroundData } from '../types';
import type { SharedMaterials } from './palette';
import { createColorBatch } from './mini-batch';
import type { FieldShape } from './field-shape';
import { MODEL_SIZE, addMiniGround, createMiniMaterial } from './mini-ground';
import { PLAQUE_HALF_RUN, PLAQUE_Y, createPlaque } from './plaque';
import { createStandMat, updateStandMat, type StandMat } from './stand-mat';

export interface GroundStand {
  slug: string;
  model: { x: number; y: number; z: number };
  size: number;
  mat: { x: number; z: number; radius: number };
  returnSpawn: { x: number; z: number; yaw: number };
}

export interface GroundModels {
  stands: GroundStand[];
  update: (state: GameState) => void;
  dispose: () => void;
}

const RING_SCALE = 0.62;
const START_ANGLE = (20 * Math.PI) / 180;
const PLINTH_HALF = 3.5;
const PLINTH_HEIGHT = 1.2;
const PLAQUE_DIST = 5.0;
const MAT_DIST = 9.0;
const MAT_RADIUS = 3.5;
const RETURN_DIST = 6;
const ENTER_SPEED = 4;
const REARM_MARGIN = 2;
const NEAR_DIST = 12;
const PLINTH_COLORS = { timber: 0x6b4a2b, cream: 0xf3ead3, willow: 0xd8b87a };

function yawQuat(yaw: number): { x: number; y: number; z: number; w: number } {
  return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}

interface Placed {
  stand: GroundStand;
  centre: { x: number; z: number };
  yaw: number;
  mat: StandMat;
  armed: boolean | null;
}

/** The stand's own group: plinth and the ground's miniature, one draw call. */
function buildStandGroup(
  mat: THREE.Material,
  slug: string,
  disposers: Array<() => void>
): THREE.Group {
  const batch = createColorBatch();
  const w = PLINTH_HALF * 2;
  batch.box(PLINTH_COLORS.timber, w, PLINTH_HEIGHT, w, { y: PLINTH_HEIGHT / 2 });
  batch.box(PLINTH_COLORS.cream, w + 0.3, 0.12, w + 0.3, { y: PLINTH_HEIGHT + 0.06 });
  batch.box(PLINTH_COLORS.willow, w + 0.05, 0.12, w + 0.05, { y: 0.3 });
  batch.lift(PLINTH_HEIGHT + 0.12);
  addMiniGround(batch, slug);
  const built = batch.build(mat);
  const group = new THREE.Group();
  group.add(built.group);
  disposers.push(built.dispose);
  return group;
}

function addColliders(
  world: RAPIER.World,
  rapier: typeof RAPIER,
  centre: { x: number; z: number },
  yaw: number
): RAPIER.RigidBody {
  const body = world.createRigidBody(
    rapier.RigidBodyDesc.fixed().setTranslation(centre.x, 0, centre.z).setRotation(yawQuat(yaw))
  );
  world.createCollider(
    rapier.ColliderDesc.cuboid(PLINTH_HALF, PLINTH_HEIGHT / 2, PLINTH_HALF).setTranslation(
      0,
      PLINTH_HEIGHT / 2,
      0
    ),
    body
  );
  world.createCollider(
    rapier.ColliderDesc.cuboid(2.6, PLAQUE_Y / 2 + 0.1, PLAQUE_HALF_RUN).setTranslation(
      0,
      PLAQUE_Y / 2 + 0.1,
      PLAQUE_DIST
    ),
    body
  );
  return body;
}

function computePlacement(
  index: number,
  count: number,
  field: FieldShape
): { centre: { x: number; z: number }; yaw: number; dir: { x: number; z: number } } {
  const a = START_ANGLE + (index / count) * Math.PI * 2;
  const centre = { x: Math.cos(a) * field.rx * RING_SCALE, z: Math.sin(a) * field.rz * RING_SCALE };
  const len = Math.hypot(centre.x, centre.z) || 1;
  const dir = { x: -centre.x / len, z: -centre.z / len };
  return { centre, yaw: Math.atan2(dir.x, dir.z), dir };
}

interface PlaceContext {
  materials: SharedMaterials;
  miniMat: THREE.Material;
  world: RAPIER.World;
  rapier: typeof RAPIER;
}

function placeStand(
  g: GroundData,
  index: number,
  count: number,
  field: FieldShape,
  ctx: PlaceContext,
  disposers: Array<() => void>
): { group: THREE.Group; body: RAPIER.RigidBody; redraw: () => void; placed: Placed } {
  const { centre, yaw, dir } = computePlacement(index, count, field);
  const group = buildStandGroup(ctx.miniMat, g.slug, disposers);
  const plaque = createPlaque(g.name, g.projectTitle, ctx.materials);
  plaque.group.position.z = PLAQUE_DIST;
  const mat = createStandMat(ctx.materials, MAT_RADIUS);
  mat.group.position.z = MAT_DIST;
  group.add(plaque.group, mat.group);
  disposers.push(plaque.dispose, mat.dispose);
  group.position.set(centre.x, 0, centre.z);
  group.rotation.y = yaw;
  const body = addColliders(ctx.world, ctx.rapier, centre, yaw);
  const matPos = { x: centre.x + dir.x * MAT_DIST, z: centre.z + dir.z * MAT_DIST };
  const stand: GroundStand = {
    slug: g.slug,
    model: { x: centre.x, y: PLINTH_HEIGHT + 0.12, z: centre.z },
    size: MODEL_SIZE,
    mat: { ...matPos, radius: MAT_RADIUS },
    returnSpawn: { x: matPos.x + dir.x * RETURN_DIST, z: matPos.z + dir.z * RETURN_DIST, yaw }
  };
  return { group, body, redraw: plaque.redraw, placed: { stand, centre, yaw, mat, armed: null } };
}

export function createGroundModels(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  grounds: GroundData[],
  field: FieldShape,
  onEnter: (slug: string) => void
): GroundModels {
  const disposers: Array<() => void> = [];
  const root = new THREE.Group();
  root.name = 'ground-models';
  scene.add(root);
  const placed: Placed[] = [];
  const miniMat = createMiniMaterial();
  const bodies: RAPIER.RigidBody[] = [];
  const redraws: Array<() => void> = [];

  grounds.forEach((g, i) => {
    const one = placeStand(
      g,
      i,
      grounds.length,
      field,
      { materials, miniMat, world, rapier },
      disposers
    );
    root.add(one.group);
    bodies.push(one.body);
    redraws.push(one.redraw);
    placed.push(one.placed);
  });

  let disposed = false;
  document.fonts
    .load('100px "Alfa Slab One"')
    .then(() => {
      if (!disposed) for (const r of redraws) r();
    })
    .catch(() => undefined);

  function update(state: GameState): void {
    const v = state.vehicle;
    if (!v) return;
    const p = v.currentPosition;
    const t = performance.now() / 1000;
    for (const s of placed) {
      const m = s.stand.mat;
      const dist = Math.hypot(p.x - m.x, p.z - m.z);
      const inside = dist < m.radius;
      if (s.armed === null) s.armed = !inside;
      if (!s.armed && dist > m.radius + REARM_MARGIN) s.armed = true;
      if (s.armed && inside && Math.abs(v.speed) < ENTER_SPEED) {
        s.armed = false;
        onEnter(s.stand.slug);
      }
      updateStandMat(s.mat, dist < NEAR_DIST, t);
    }
  }

  return {
    stands: placed.map((s) => s.stand),
    update,
    dispose: () => {
      disposed = true;
      scene.remove(root);
      for (const d of disposers) d();
      miniMat.dispose();
      for (const b of bodies) world.removeRigidBody(b);
    }
  };
}
