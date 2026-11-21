import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from '../world/palette';
import type { GameState } from '../types';

export interface StumpsInstance {
  group: THREE.Group;
  update: (state: GameState) => void;
  dispose: () => void;
}

interface Part {
  body: RAPIER.RigidBody;
  index: number;
  isStump: boolean;
  wicket: number;
  initialPos: THREE.Vector3;
}

const WICKET_Z = [-8.8, 8.8];
const STUMP_X = [-0.11, 0, 0.11];
const BAIL_X = [-0.055, 0.055];
const STUMP_HALF_HEIGHT = 0.36;
// A hair above the stump tops so the bails seat without interpenetrating.
const BAIL_Y = STUMP_HALF_HEIGHT * 2 + 0.02 + 0.003;
const RESET_DELAY = 8;
const RESET_CLEARANCE = 2;
// A free-standing 72 cm cylinder on a 4 cm radius falls over by itself, as real stumps would
// if they weren't pushed into the ground. So wickets are fixed bodies until the roller comes
// within this distance while moving, then they turn dynamic and the collision knocks them.
const RELEASE_DISTANCE = 1.8;
const RELEASE_SPEED = 0.5;

function createParts(
  world: RAPIER.World,
  rapier: typeof RAPIER
): { stumps: Part[]; bails: Part[] } {
  const stumps: Part[] = [];
  const bails: Part[] = [];

  WICKET_Z.forEach((z, wicket) => {
    for (const x of STUMP_X) {
      const body = world.createRigidBody(
        rapier.RigidBodyDesc.fixed()
          .setTranslation(x, STUMP_HALF_HEIGHT, z)
          .setLinearDamping(0.8)
          .setAngularDamping(0.8)
      );
      const collider = rapier.ColliderDesc.cylinder(STUMP_HALF_HEIGHT, 0.04)
        .setDensity(400)
        .setRestitution(0.4);
      world.createCollider(collider, body);
      stumps.push({
        body,
        index: stumps.length,
        isStump: true,
        wicket,
        initialPos: new THREE.Vector3(x, STUMP_HALF_HEIGHT, z)
      });
    }
    for (const x of BAIL_X) {
      const body = world.createRigidBody(
        rapier.RigidBodyDesc.fixed().setTranslation(x, BAIL_Y, z).setLinearDamping(0.5)
      );
      world.createCollider(rapier.ColliderDesc.cuboid(0.055, 0.02, 0.02).setDensity(200), body);
      bails.push({
        body,
        index: bails.length,
        isStump: false,
        wicket,
        initialPos: new THREE.Vector3(x, BAIL_Y, z)
      });
    }
  });
  return { stumps, bails };
}

interface Rendering {
  stumpMesh: THREE.InstancedMesh;
  bailMesh: THREE.InstancedMesh;
  writePart: (part: Part, mesh: THREE.InstancedMesh) => void;
  dispose: () => void;
}

function createRendering(materials: SharedMaterials, stumps: Part[], bails: Part[]): Rendering {
  const stumpGeo = new THREE.CylinderGeometry(0.04, 0.04, STUMP_HALF_HEIGHT * 2, 8);
  const bailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.11, 6);
  bailGeo.rotateZ(Math.PI / 2);
  // Instancing keeps ten moving parts down to two draw calls.
  const stumpMesh = new THREE.InstancedMesh(stumpGeo, materials.willow, stumps.length);
  const bailMesh = new THREE.InstancedMesh(bailGeo, materials.willow, bails.length);
  stumpMesh.frustumCulled = false;
  bailMesh.frustumCulled = false;

  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const unit = new THREE.Vector3(1, 1, 1);
  const matrix = new THREE.Matrix4();

  function writePart(part: Part, mesh: THREE.InstancedMesh): void {
    const t = part.body.translation();
    const r = part.body.rotation();
    matrix.compose(pos.set(t.x, t.y, t.z), quat.set(r.x, r.y, r.z, r.w), unit);
    mesh.setMatrixAt(part.index, matrix);
  }

  for (const part of stumps) writePart(part, stumpMesh);
  for (const part of bails) writePart(part, bailMesh);

  return {
    stumpMesh,
    bailMesh,
    writePart,
    dispose: () => {
      stumpMesh.dispose();
      bailMesh.dispose();
      stumpGeo.dispose();
      bailGeo.dispose();
    }
  };
}

function createWicketControl(
  allParts: Part[],
  rapier: typeof RAPIER,
  rendering: Rendering
): { release: (state: GameState) => void; reset: () => void } {
  const { stumpMesh, bailMesh, writePart } = rendering;
  const released = WICKET_Z.map(() => false);

  function release(state: GameState): void {
    const v = state.vehicle;
    if (!v || Math.abs(v.speed) < RELEASE_SPEED) return;
    WICKET_Z.forEach((z, wicket) => {
      if (released[wicket]) return;
      if (Math.hypot(v.currentPosition.x, v.currentPosition.z - z) > RELEASE_DISTANCE) return;
      released[wicket] = true;
      for (const part of allParts) {
        if (part.wicket === wicket) part.body.setBodyType(rapier.RigidBodyType.Dynamic, true);
      }
    });
  }

  function reset(): void {
    released.fill(false);
    for (const part of allParts) {
      part.body.setBodyType(rapier.RigidBodyType.Fixed, false);
      part.body.setTranslation(part.initialPos, true);
      part.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      part.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      part.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      writePart(part, part.isStump ? stumpMesh : bailMesh);
    }
    stumpMesh.instanceMatrix.needsUpdate = true;
    bailMesh.instanceMatrix.needsUpdate = true;
  }
  return { release, reset };
}

export function createStumps(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  onHowzat?: () => void
): StumpsInstance {
  const group = new THREE.Group();
  group.name = 'cricket-stumps';

  const { stumps, bails } = createParts(world, rapier);
  const allParts = [...stumps, ...bails];
  const rendering = createRendering(materials, stumps, bails);
  const { stumpMesh, bailMesh, writePart } = rendering;
  group.add(stumpMesh, bailMesh);
  scene.add(group);

  let hasAppealed = false;
  let resetTimer = 0;

  function rollerNearWicket(state: GameState): boolean {
    const v = state.vehicle?.currentPosition;
    if (!v) return false;
    return WICKET_Z.some((z) => Math.hypot(v.x, v.z - z) < RESET_CLEARANCE);
  }

  const wickets = createWicketControl(allParts, rapier, rendering);
  const releaseNearbyWicket = wickets.release;
  const resetWickets = (): void => {
    hasAppealed = false;
    wickets.reset();
  };

  function update(state: GameState): void {
    releaseNearbyWicket(state);
    let stumpsDirty = false;
    let bailsDirty = false;

    for (const part of allParts) {
      if (part.body.isSleeping() || part.body.isFixed()) continue;
      if (part.isStump) {
        writePart(part, stumpMesh);
        stumpsDirty = true;
      } else {
        writePart(part, bailMesh);
        bailsDirty = true;
      }

      const t = part.body.translation();
      const r = part.body.rotation();
      const toppled = t.y < 0.25 || Math.abs(r.x) > 0.4 || Math.abs(r.z) > 0.4;
      if (!hasAppealed && toppled) {
        hasAppealed = true;
        resetTimer = RESET_DELAY;
        if (onHowzat) onHowzat();
      }
    }
    if (stumpsDirty) stumpMesh.instanceMatrix.needsUpdate = true;
    if (bailsDirty) bailMesh.instanceMatrix.needsUpdate = true;

    if (hasAppealed) {
      resetTimer -= state.time.dt;
      if (resetTimer <= 0 && !rollerNearWicket(state)) resetWickets();
    }
  }

  return {
    group,
    update,
    dispose: () => {
      scene.remove(group);
      for (const part of allParts) world.removeRigidBody(part.body);
      rendering.dispose();
    }
  };
}
