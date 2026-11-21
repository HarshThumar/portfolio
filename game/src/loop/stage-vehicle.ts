import * as THREE from 'three';
import type { GameState, Stage, VehicleState } from '../types';

const DRIVE_FORCE = 850.0;
const TURN_TORQUE = 600.0;
const MAX_SPEED = 7.5;
const LATERAL_FRICTION = 0.82; // 0.82 leaves a little drift as specified in docs/03

function handleDriveTarget(
  vehicle: VehicleState,
  state: GameState
): { forward: number; steer: number } {
  let { forward, steer } = state.inputs;

  if (forward !== 0 || steer !== 0) {
    vehicle.driveTarget = null;
    return { forward, steer };
  }

  if (vehicle.driveTarget) {
    const pos = vehicle.body.translation();
    const dx = vehicle.driveTarget.x - pos.x;
    const dz = vehicle.driveTarget.z - pos.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 1.2) {
      vehicle.driveTarget = null;
    } else {
      const rot = vehicle.body.rotation();
      const currentQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
      const heading = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQuat);
      const targetVec = new THREE.Vector3(dx, 0, dz).normalize();

      const angle = Math.atan2(
        heading.x * targetVec.z - heading.z * targetVec.x,
        heading.x * targetVec.x + heading.z * targetVec.z
      );

      steer = Math.max(-1, Math.min(1, angle * 2.0));
      forward = Math.cos(angle) > 0.2 ? 0.85 : 0.2;
    }
  }

  return { forward, steer };
}

function applyVehicleForces(
  vehicle: VehicleState,
  forward: number,
  steer: number,
  brake: boolean
): void {
  const body = vehicle.body;
  const rot = body.rotation();
  const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
  const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
  const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

  const vel = body.linvel();
  const horizSpeed = Math.hypot(vel.x, vel.z);
  vehicle.speed = horizSpeed;

  // Forward acceleration (heavy feel)
  if (forward !== 0 && horizSpeed < MAX_SPEED) {
    const impulse = forward * DRIVE_FORCE * 0.016;
    body.applyImpulse({ x: forwardVec.x * impulse, y: 0, z: forwardVec.z * impulse }, true);
  }

  // Steering torque
  if (steer !== 0) {
    const torque = -steer * TURN_TORQUE * 0.016;
    body.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true);
  }

  // Lateral drift slip correction
  const latSpeed = vel.x * rightVec.x + vel.z * rightVec.z;
  const opposingLat = -latSpeed * LATERAL_FRICTION;
  body.applyImpulse({ x: rightVec.x * opposingLat, y: 0, z: rightVec.z * opposingLat }, true);

  // Braking
  if (brake) {
    body.applyImpulse({ x: -vel.x * 0.25, y: 0, z: -vel.z * 0.25 }, true);
  }
}

export function createStageVehicle(): Stage {
  return {
    name: 'vehicle',
    order: 10,
    update: (state: GameState) => {
      const vehicle = state.vehicle;
      if (!vehicle) return;

      // Cache previous transform for interpolation
      const pos = vehicle.body.translation();
      const rot = vehicle.body.rotation();
      vehicle.previousPosition.copy(vehicle.currentPosition);
      vehicle.previousRotation.copy(vehicle.currentRotation);
      vehicle.currentPosition.set(pos.x, pos.y, pos.z);
      vehicle.currentRotation.set(rot.x, rot.y, rot.z, rot.w);

      const { forward, steer } = handleDriveTarget(vehicle, state);
      applyVehicleForces(vehicle, forward, steer, state.inputs.brake);
    }
  };
}
