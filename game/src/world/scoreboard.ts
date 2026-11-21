import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';
import type { GameState, GroundData } from '../types';
import { createMergeBatch, type MergedGroup } from './merge-batch';
import { yawQuaternion } from './ground-colliders';
import { createScoreTiles, parseScoreboard } from './scoreboard-tiles';

export interface ScoreboardInstance {
  group: THREE.Group;
  triggerFlip: () => void;
  update: (state: GameState) => void;
  dispose: () => void;
}

const FLIP_SECONDS = 0.5;
const FLIP_STAGGER = 0.12;
const APPROACH_DISTANCE = 18;
const REARM_DISTANCE = 26;
const FRAME_HEIGHT = 6;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function buildFrame(materials: SharedMaterials): MergedGroup {
  const b = createMergeBatch();
  b.box(materials.timber, 0.35, FRAME_HEIGHT, 0.35, -4.2, 3, 0);
  b.box(materials.timber, 0.35, FRAME_HEIGHT, 0.35, 4.2, 3, 0);
  b.box(materials.ink, 8.2, 4.2, 0.15, 0, 3.4, -0.05);
  b.box(materials.timber, 8.6, 0.6, 0.3, 0, 5.6, 0);
  // Tiles hang forward of the board on a rail so a full turn never touches it.
  b.box(materials.timber, 8.4, 0.14, 0.14, 0, 4.7, 1.1);
  b.box(materials.timber, 0.14, 0.14, 1.1, -4.2, 4.7, 0.55);
  b.box(materials.timber, 0.14, 0.14, 1.1, 4.2, 4.7, 0.55);
  return b.build();
}

export function createScoreboard(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  position: { x: number; y: number; z: number },
  rotationY: number,
  ground: GroundData
): ScoreboardInstance {
  const group = new THREE.Group();
  group.name = 'manual-scoreboard';
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;

  const frame = buildFrame(materials);
  const tileSet = createScoreTiles(parseScoreboard(ground.scoreboard), materials);
  group.add(frame.group, tileSet.group);
  scene.add(group);

  const body = world.createRigidBody(
    rapier.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z)
      .setRotation(yawQuaternion(rotationY))
  );
  world.createCollider(
    rapier.ColliderDesc.cuboid(4.4, FRAME_HEIGHT / 2, 0.7).setTranslation(0, FRAME_HEIGHT / 2, 0.5),
    body
  );

  let disposed = false;
  document.fonts
    .load('100px "Alfa Slab One"')
    .then(() => {
      if (!disposed) tileSet.redraw();
    })
    .catch(() => undefined);

  let flipTime = -1;
  let armed = true;
  const flipTotal = FLIP_SECONDS + FLIP_STAGGER * Math.max(0, tileSet.tiles.length - 1);

  function triggerFlip(): void {
    flipTime = 0;
  }

  function update(state: GameState): void {
    const vehicle = state.vehicle;
    if (vehicle) {
      const dist = Math.hypot(
        vehicle.currentPosition.x - position.x,
        vehicle.currentPosition.z - position.z
      );
      if (armed && dist < APPROACH_DISTANCE) {
        armed = false;
        triggerFlip();
      } else if (!armed && dist > REARM_DISTANCE) {
        armed = true;
      }
    }
    if (flipTime < 0) return;

    flipTime += state.time.dt;
    const done = flipTime >= flipTotal;
    tileSet.tiles.forEach((tile, i) => {
      const p = Math.min(1, Math.max(0, (flipTime - i * FLIP_STAGGER) / FLIP_SECONDS));
      tile.rotation.y = done ? 0 : easeInOutCubic(p) * Math.PI * 2;
    });
    if (done) flipTime = -1;
  }

  return {
    group,
    triggerFlip,
    update,
    dispose: () => {
      disposed = true;
      scene.remove(group);
      world.removeRigidBody(body);
      frame.dispose();
      tileSet.dispose();
    }
  };
}
