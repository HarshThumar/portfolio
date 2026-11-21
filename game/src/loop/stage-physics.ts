import type { GameState, Stage } from '../types';
import { applyDriveStep } from '../vehicle/roller-drive';
import { stepAccumulator } from './physics-accumulator';

export function createStagePhysics(): Stage {
  return {
    name: 'physics',
    order: 20,
    update: (state: GameState, dt: number) => {
      const { steps, remainder, alpha } = stepAccumulator(
        state.time.accumulator,
        dt,
        state.time.fixedDelta
      );
      state.time.accumulator = remainder;
      state.time.alpha = alpha;

      const vehicle = state.vehicle;
      for (let i = 0; i < steps; i++) {
        if (vehicle) {
          vehicle.speed = applyDriveStep(vehicle.body, vehicle.intent, state.time.fixedDelta);
          vehicle.previousPosition.copy(vehicle.currentPosition);
          vehicle.previousRotation.copy(vehicle.currentRotation);
        }
        state.physics.world.step();
        if (vehicle) {
          const pos = vehicle.body.translation();
          const rot = vehicle.body.rotation();
          vehicle.currentPosition.set(pos.x, pos.y, pos.z);
          vehicle.currentRotation.set(rot.x, rot.y, rot.z, rot.w);
        }
      }
    }
  };
}
