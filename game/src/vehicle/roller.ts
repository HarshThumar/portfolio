import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { createRollerModel, type RollerModel } from './roller-model';
import type { SharedMaterials } from '../world/palette';
import type { VehicleState } from '../types';

function createRollerPhysics(
  world: RAPIER.World,
  rapier: typeof RAPIER,
  startPos: { x: number; y: number; z: number } = { x: 0, y: 0.8, z: 0 }
): RAPIER.RigidBody {
  const bodyDesc = rapier.RigidBodyDesc.dynamic()
    .setTranslation(startPos.x, startPos.y, startPos.z)
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
  startPos = { x: 0, y: 0.8, z: 0 }
): VehicleState {
  const model: RollerModel = createRollerModel(materials);
  model.group.position.set(startPos.x, startPos.y, startPos.z);
  scene.add(model.group);

  const body = createRollerPhysics(world, rapier, startPos);

  const currentPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
  const currentRot = new THREE.Quaternion(0, 0, 0, 1);

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
