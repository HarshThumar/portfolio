import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { createRollerModel, type RollerModel } from './roller-model';
import type { SharedMaterials } from '../world/palette';
import type { VehicleState } from '../types';

function createRollerPhysics(
  world: RAPIER.World,
  rapier: typeof RAPIER,
  startPos: { x: number; y: number; z: number } = { x: 0, y: 0.8, z: 0 },
  startRotY = 0
): RAPIER.RigidBody {
  const half = startRotY * 0.5;
  const bodyDesc = rapier.RigidBodyDesc.dynamic()
    .setTranslation(startPos.x, startPos.y, startPos.z)
    .setRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) })
    .setLinearDamping(1.8)
    .setAngularDamping(4.0)
    .setCanSleep(false);

  const body = world.createRigidBody(bodyDesc);

  // Main chassis collider
  const chassisColliderDesc = rapier.ColliderDesc.cuboid(0.7, 0.45, 1.1)
    .setDensity(1200)
    .setFriction(0.6)
    .setRestitution(0.1);
  world.createCollider(chassisColliderDesc, body);

  return body;
}

export function createRoller(
  scene: THREE.Scene,
  world: RAPIER.World,
  rapier: typeof RAPIER,
  materials: SharedMaterials,
  startPos = { x: 0, y: 0.8, z: 0 },
  startRotY = 0
): VehicleState {
  const model: RollerModel = createRollerModel(materials);
  model.group.position.set(startPos.x, startPos.y, startPos.z);
  model.group.rotation.y = startRotY;
  scene.add(model.group);

  const body = createRollerPhysics(world, rapier, startPos, startRotY);

  const currentPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
  const half = startRotY * 0.5;
  const currentRot = new THREE.Quaternion(0, Math.sin(half), 0, Math.cos(half));

  return {
    body,
    model,
    speed: 0,
    driveTarget: null,
    previousPosition: currentPos.clone(),
    previousRotation: currentRot.clone(),
    currentPosition: currentPos,
    currentRotation: currentRot
  };
}
