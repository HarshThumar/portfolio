import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from '../world/palette';
import type { GameState } from '../types';

export interface StumpsInstance {
  group: THREE.Group;
  update: (state: GameState) => void;
  dispose: () => void;
}

interface StumpPart {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  initialPos: THREE.Vector3;
  initialRot: THREE.Quaternion;
}

function createWicket(
  group: THREE.Group,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  zPos: number
): { parts: StumpPart[]; dispose: () => void } {
  const parts: StumpPart[] = [];
  const disposables: Array<() => void> = [];

  const stumpGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8);
  disposables.push(() => stumpGeo.dispose());

  // 3 Stumps: Off, Middle, Leg
  const xOffsets = [-0.11, 0, 0.11];
  for (const x of xOffsets) {
    const mesh = new THREE.Mesh(stumpGeo, materials.willow);
    mesh.position.set(x, 0.36, zPos);
    mesh.castShadow = true;
    group.add(mesh);

    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(x, 0.36, zPos)
      .setLinearDamping(0.8)
      .setAngularDamping(0.8);
    const body = world.createRigidBody(bodyDesc);
    const collider = rapier.ColliderDesc.cylinder(0.36, 0.04).setDensity(400).setRestitution(0.4);
    world.createCollider(collider, body);

    parts.push({
      mesh,
      body,
      initialPos: new THREE.Vector3(x, 0.36, zPos),
      initialRot: mesh.quaternion.clone()
    });
  }

  // 2 Bails on top
  const bailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.11, 6);
  bailGeo.rotateZ(Math.PI / 2);
  disposables.push(() => bailGeo.dispose());

  const bailX = [-0.055, 0.055];
  for (const bx of bailX) {
    const mesh = new THREE.Mesh(bailGeo, materials.willow);
    mesh.position.set(bx, 0.73, zPos);
    group.add(mesh);

    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(bx, 0.73, zPos)
      .setLinearDamping(0.5);
    const body = world.createRigidBody(bodyDesc);
    const collider = rapier.ColliderDesc.cuboid(0.055, 0.02, 0.02).setDensity(200);
    world.createCollider(collider, body);

    parts.push({
      mesh,
      body,
      initialPos: new THREE.Vector3(bx, 0.73, zPos),
      initialRot: mesh.quaternion.clone()
    });
  }

  return {
    parts,
    dispose: () => {
      for (const p of parts) world.removeRigidBody(p.body);
      for (const fn of disposables) fn();
    }
  };
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
  scene.add(group);

  const north = createWicket(group, world, rapier, materials, -8.8);
  const south = createWicket(group, world, rapier, materials, 8.8);
  const allParts = [...north.parts, ...south.parts];

  let hasAppealed = false;
  let resetTimer = 0;

  function update(state: GameState): void {
    const dt = state.time.dt;

    for (const part of allParts) {
      const pos = part.body.translation();
      const rot = part.body.rotation();
      part.mesh.position.set(pos.x, pos.y, pos.z);
      part.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

      // Check if knocked over (fallen below y = 0.3 or tilted significantly)
      if (!hasAppealed && (pos.y < 0.25 || Math.abs(rot.x) > 0.4 || Math.abs(rot.z) > 0.4)) {
        hasAppealed = true;
        resetTimer = 8.0;
        if (onHowzat) onHowzat();
      }
    }

    if (hasAppealed) {
      resetTimer -= dt;
      if (resetTimer <= 0) {
        hasAppealed = false;
        for (const part of allParts) {
          part.body.setTranslation(part.initialPos, true);
          part.body.setRotation(part.initialRot, true);
          part.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          part.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    }
  }

  return {
    group,
    update,
    dispose: () => {
      scene.remove(group);
      north.dispose();
      south.dispose();
    }
  };
}
