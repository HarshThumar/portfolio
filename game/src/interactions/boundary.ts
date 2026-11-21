import type { GameState } from '../types';

export interface BoundaryDetector {
  update: (state: GameState) => void;
}

const BOUNDARY_X = 42.0;
const BOUNDARY_Z = 50.0;
// Roller top speed is 7.5 m/s, so 3 m/s is a firm push rather than a nudge.
const SIX_SPEED_THRESHOLD = 3.0;
// Normalised distance squared the roller must fall back inside before it can fire again.
const REARM_DIST_SQ = 0.85;
const COOLDOWN_SECONDS = 4.0;

export function createBoundaryDetector(onSix: () => void): BoundaryDetector {
  let armed = true;
  let wasInside = true;
  let cooldown = 0;

  return {
    update: (state: GameState) => {
      if (cooldown > 0) cooldown -= state.time.dt;

      const vehicle = state.vehicle;
      if (!vehicle) return;

      const pos = vehicle.currentPosition;
      const nx = pos.x / BOUNDARY_X;
      const nz = pos.z / BOUNDARY_Z;
      const distSq = nx * nx + nz * nz;
      const isInside = distSq < 1.0;

      if (distSq < REARM_DIST_SQ) armed = true;

      if (armed && wasInside && !isInside && cooldown <= 0) {
        if (Math.abs(vehicle.speed) >= SIX_SPEED_THRESHOLD) {
          onSix();
          cooldown = COOLDOWN_SECONDS;
          armed = false;
        }
      }

      wasInside = isInside;
    }
  };
}
