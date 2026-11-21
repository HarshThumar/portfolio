import * as THREE from 'three/webgpu';
import type { GameState, Stage, VehicleState } from '../types';

// docs/04: a miniature is looked at from above, like a model on a table. The camera sits
// higher and further back than a chase cam, looking down at the roller.
const BEHIND = 12;
const ABOVE = 9;
const LOOK_AHEAD = 2.5;
const LOOK_AHEAD_PER_SPEED = 0.35;

const forwardVec = new THREE.Vector3();

/** Where the follow camera wants to be for this vehicle (also used to aim the swoop-in). */
export function followTarget(
  vehicle: VehicleState,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3
): void {
  const vPos = vehicle.model.group.position;
  forwardVec.set(0, 0, 1).applyQuaternion(vehicle.model.group.quaternion);
  outPos.set(vPos.x - forwardVec.x * BEHIND, vPos.y + ABOVE, vPos.z - forwardVec.z * BEHIND);
  const lookDist = LOOK_AHEAD + Math.max(0, vehicle.speed) * LOOK_AHEAD_PER_SPEED;
  outLook.set(vPos.x + forwardVec.x * lookDist, vPos.y + 0.5, vPos.z + forwardVec.z * lookDist);
}

export function createStageCamera(): Stage {
  const idealPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();

  return {
    name: 'camera',
    order: 60,
    update: (state: GameState, dt: number) => {
      const look = state.cameraLook;
      if (state.cameraShot) {
        if (state.cameraShot(state.camera, look, dt)) state.cameraShot = null;
        state.camera.lookAt(look);
        return;
      }

      const vehicle = state.vehicle;
      if (!vehicle) return;
      followTarget(vehicle, idealPos, targetLook);

      // Smooth lag using exponential decay (frame-rate independent)
      const camFactor = 1 - Math.exp(-4.5 * dt);
      const lookFactor = 1 - Math.exp(-7.0 * dt);

      state.camera.position.lerp(idealPos, camFactor);
      look.lerp(targetLook, lookFactor);
      state.camera.lookAt(look);
    }
  };
}
