import * as THREE from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { SharedMaterials } from './palette';
import { createMergeBatch } from './merge-batch';
import { yawQuaternion } from './ground-colliders';
import { PAVILION_BLOCK, PAVILION_STEPS, addPavilionParts } from './pavilion-parts';

export interface LordsPavilionInstance {
  group: THREE.Group;
  dispose: () => void;
}

export function createLordsPavilion(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  position = { x: 0, y: 0, z: -54 },
  rotationY = 0
): LordsPavilionInstance {
  const batch = createMergeBatch();
  addPavilionParts(batch, materials);
  const built = batch.build();

  const group = built.group;
  group.name = 'lords-pavilion';
  group.position.set(position.x, position.y, position.z);
  group.rotation.y = rotationY;
  scene.add(group);

  const body = world.createRigidBody(
    rapier.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z)
      .setRotation(yawQuaternion(rotationY))
  );
  const { halfWidth, backZ, frontZ, height } = PAVILION_BLOCK;
  const halfDepth = (frontZ - backZ) / 2;
  world.createCollider(
    rapier.ColliderDesc.cuboid(halfWidth, height / 2, halfDepth).setTranslation(
      0,
      height / 2,
      backZ + halfDepth
    ),
    body
  );
  const steps = PAVILION_STEPS;
  const stepDepth = (steps.frontZ - frontZ) / 2;
  world.createCollider(
    rapier.ColliderDesc.cuboid(steps.halfWidth, steps.height / 2, stepDepth).setTranslation(
      0,
      steps.height / 2,
      frontZ + stepDepth
    ),
    body
  );

  return {
    group,
    dispose: () => {
      scene.remove(group);
      built.dispose();
      world.removeRigidBody(body);
    }
  };
}
