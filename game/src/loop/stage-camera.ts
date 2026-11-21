import * as THREE from 'three/webgpu';
import type { GameState, Stage } from '../types';

export function createStageCamera(): Stage {
  const currentLookAt = new THREE.Vector3(0, 1, 0);
  const idealPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const forwardVec = new THREE.Vector3();

  return {
    name: 'camera',
    order: 60,
    update: (state: GameState, dt: number) => {
      const vehicle = state.vehicle;
      if (!vehicle) return;

      const vPos = vehicle.model.group.position;
      const vQuat = vehicle.model.group.quaternion;
      forwardVec.set(0, 0, 1).applyQuaternion(vQuat);

      // Camera sits behind and above the vehicle
      idealPos.set(vPos.x - forwardVec.x * 9.5, vPos.y + 6.0, vPos.z - forwardVec.z * 9.5);

      // Look-ahead slightly in front of the vehicle based on speed
      const lookDist = 2.5 + Math.max(0, vehicle.speed) * 0.35;
      targetLook.set(
        vPos.x + forwardVec.x * lookDist,
        vPos.y + 0.8,
        vPos.z + forwardVec.z * lookDist
      );

      // Smooth lag using exponential decay (frame-rate independent)
      const camFactor = 1 - Math.exp(-4.5 * dt);
      const lookFactor = 1 - Math.exp(-7.0 * dt);

      state.camera.position.lerp(idealPos, camFactor);
      currentLookAt.lerp(targetLook, lookFactor);
      state.camera.lookAt(currentLookAt);
    }
  };
}
