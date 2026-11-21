import type { GameState } from '../types';

export interface BoundaryDetector {
  update: (state: GameState) => void;
}

const BOUNDARY_X = 42.0;
const BOUNDARY_Z = 50.0;
const SIX_SPEED_THRESHOLD = 3.0;

export function createBoundaryDetector(onSix: () => void): BoundaryDetector {
  let wasInside = true;
  let cooldown = 0;

  return {
    update: (state: GameState) => {
      const dt = state.time.dt;
      if (cooldown > 0) {
        cooldown -= dt;
      }

      const vehicle = state.vehicle;
      if (!vehicle) return;

      const pos = vehicle.currentPosition;
      const normalizedDistSq =
        (pos.x / BOUNDARY_X) * (pos.x / BOUNDARY_X) + (pos.z / BOUNDARY_Z) * (pos.z / BOUNDARY_Z);

      const isInside = normalizedDistSq < 1.0;

      // Crossing from inside to outside
      if (wasInside && !isInside && cooldown <= 0) {
        if (vehicle.speed >= SIX_SPEED_THRESHOLD) {
          onSix();
          cooldown = 4.0; // Debounce for 4 seconds
        }
      }

      wasInside = isInside;
    }
  };
}
