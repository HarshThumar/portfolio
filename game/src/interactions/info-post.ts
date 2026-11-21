import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from '../world/palette';
import type { GameState } from '../types';

export interface InfoPostInstance {
  group: THREE.Group;
  update: (state: GameState) => void;
  dispose: () => void;
}

export function createInfoPost(
  scene: THREE.Scene,
  _world: RAPIER.World,
  _rapier: typeof RAPIER,
  materials: SharedMaterials,
  position: { x: number; y: number; z: number },
  onTrigger: () => void
): InfoPostInstance {
  const group = new THREE.Group();
  group.name = 'info-post';
  group.position.set(position.x, position.y, position.z);

  const disposables: Array<() => void> = [];

  // Wooden post
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
  const post = new THREE.Mesh(postGeo, materials.timber);
  post.position.y = 0.9;
  post.castShadow = true;
  group.add(post);
  disposables.push(() => postGeo.dispose());

  // Signboard
  const boardGeo = new THREE.BoxGeometry(0.9, 0.6, 0.08);
  const board = new THREE.Mesh(boardGeo, materials.cream);
  board.position.set(0, 1.4, 0);
  board.castShadow = true;
  group.add(board);
  disposables.push(() => boardGeo.dispose());

  // Board frame
  const frameGeo = new THREE.BoxGeometry(0.96, 0.66, 0.06);
  const frame = new THREE.Mesh(frameGeo, materials.timber);
  frame.position.set(0, 1.4, -0.01);
  group.add(frame);
  disposables.push(() => frameGeo.dispose());

  // Bell-shaped cap in the willow tint; the palette has no metal colour
  const bellGeo = new THREE.ConeGeometry(0.12, 0.18, 8);
  const bell = new THREE.Mesh(bellGeo, materials.willow);
  bell.position.set(0, 1.85, 0);
  group.add(bell);
  disposables.push(() => bellGeo.dispose());

  scene.add(group);

  // Proximity is a plain distance check, so no physics collider is needed.
  let isInside = false;
  let cooldown = 0;

  function update(state: GameState): void {
    const dt = state.time.dt;
    if (cooldown > 0) cooldown -= dt;

    const vehicle = state.vehicle;
    if (!vehicle) return;

    const vPos = vehicle.currentPosition;
    const dist = Math.hypot(vPos.x - position.x, vPos.z - position.z);
    const nowInside = dist < 2.0;

    if (!isInside && nowInside && cooldown <= 0) {
      onTrigger();
      cooldown = 4.0;
    }

    isInside = nowInside;
  }

  return {
    group,
    update,
    dispose: () => {
      scene.remove(group);
      for (const fn of disposables) fn();
    }
  };
}
