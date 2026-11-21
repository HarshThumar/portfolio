import * as THREE from 'three/webgpu';
import type { GameState, Stage } from '../types';

export function createStageInterpolate(): Stage {
  const interpPos = new THREE.Vector3();
  const interpRot = new THREE.Quaternion();

  return {
    name: 'interpolate',
    order: 30,
    update: (state: GameState, dt: number) => {
      const vehicle = state.vehicle;
      if (!vehicle) return;

      const alpha = Math.max(0, Math.min(1, state.time.alpha));

      // Interpolate body transform
      interpPos.lerpVectors(vehicle.previousPosition, vehicle.currentPosition, alpha);
      interpRot.slerpQuaternions(vehicle.previousRotation, vehicle.currentRotation, alpha);

      vehicle.model.group.position.copy(interpPos);
      vehicle.model.group.quaternion.copy(interpRot);

      // Spin drums proportional to forward speed
      const drumRadius = 0.5;
      const rotationDelta = (vehicle.speed * dt) / drumRadius;
      vehicle.model.frontDrum.rotation.x += rotationDelta;
      vehicle.model.rearDrum.rotation.x += rotationDelta;

      // Rotate steering wheel slightly according to steer input
      vehicle.model.steeringWheel.rotation.z = -state.inputs.steer * 0.6;
    }
  };
}
